import { getDefaultBoosterConfig } from "./default-config";
import {
    ProfilesStateSchema,
    ProfilesExportPayloadSchema,
    STATE_SCHEMA_VERSION,
    type GameSettingsEntry,
} from '../../schemas';
import {
    runStateMigrations,
    runBoosterConfigMigrations,
    runGameSettingsMigrations,
} from './migrations';
import { type } from "arktype";
import { ok, err, type Result, type ValidationError } from '../result';
import { asSettingsRecord, diffSettings } from './game-settings-core';
import { readLegacyBoosterConfig, migrateLegacyBoosterStorage } from './legacy-config';

import type {
    BoosterConfig, Profile,
    ProfilesExportPayload, ProfilesState
} from '../../types';

const OLD_STORAGE_KEY = 'gingim-booster-profiles:v1';
const STORAGE_KEY = 'learn-booster-profiles:v1';
const DEFAULT_PROFILE_NAME = 'Default Profile';

type ProfilesListener = (state: ProfilesState) => void;

let state: ProfilesState = createEmptyState();
let isInitialized = false;
let legacyBackup: { raw: string } | undefined;
const listeners: ProfilesListener[] = [];

/**
 * **TEST-ONLY** — מאפס את ה-module-level state כדי שכל test יקבל מנהל-פרופילים נקי.
 */
export function _resetProfilesStateForTesting(): void {
    state = createEmptyState();
    isInitialized = false;
    listeners.length = 0;
    legacyBackup = undefined;
}

/** טוען אחסון ויוצר פרופיל לפני ציור המשחק, גם בלי init של המחזק. */
export function hydrateProfiles(initialConfig: BoosterConfig = getDefaultBoosterConfig()): ProfilesState {
    if (isInitialized) return getProfilesState();
    // SSR אינו מסמן hydration לדפדפן ואינו משתף פרופיל בין בקשות.
    if (typeof window === 'undefined') return getProfilesState();
    migrateLegacyBoosterStorage();
    const hadProfiles = loadFromStorage();
    if (state.order.length === 0) {
        let config = initialConfig;
        if (!hadProfiles) {
            const legacy = readLegacyBoosterConfig(initialConfig);
            config = legacy.config;
            legacyBackup = legacy.invalidRaw === undefined ? undefined : { raw: legacy.invalidRaw };
        }
        const profile = buildProfile({ name: DEFAULT_PROFILE_NAME, boosterConfig: config });
        state.profiles[profile.id] = profile;
        state.order = [profile.id];
        state.activeProfileId = profile.id;
    }
    isInitialized = true;
    persistProfilesState();
    notifyListeners();
    return getProfilesState();
}

export async function initializeProfiles(initialConfig: BoosterConfig): Promise<ProfilesState> {
    return hydrateProfiles(initialConfig);
}

export function addProfilesListener(listener: ProfilesListener): () => void {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    };
}

export function getProfilesState(): ProfilesState {
    return cloneState(state);
}

export function getActiveProfile(): Profile | undefined {
    if (!state.activeProfileId) return undefined;
    const profile = state.profiles[state.activeProfileId];
    if (!profile) return undefined;
    return cloneProfile(profile);
}

export function setActiveProfile(profileId: string): Profile {
    assertInitialized();
    const profile = state.profiles[profileId];
    if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
    }

    state.activeProfileId = profileId;
    state.dirtyBoosterConfig = null;
    persistState();
    notifyListeners();
    return cloneProfile(profile);
}

export function createProfile(options: {
    name: string;
    boosterConfig?: BoosterConfig;
    /** @deprecated use boosterConfig */
    config?: BoosterConfig;
    color?: string;
    tags?: string[];
}): Profile {
    assertInitialized();
    const boosterConfig = options.boosterConfig ?? options.config ?? getDefaultBoosterConfig();
    const profile = buildProfile({ name: options.name, boosterConfig, color: options.color, tags: options.tags });
    state.profiles[profile.id] = profile;
    state.order.push(profile.id);
    if (!state.activeProfileId) {
        state.activeProfileId = profile.id;
    }
    persistState();
    notifyListeners();
    return cloneProfile(profile);
}

export function updateProfile(
    profileId: string,
    updates: Partial<Omit<Profile, 'id' | 'boosterConfig' | 'meta'>> & {
        boosterConfig?: BoosterConfig;
        /** @deprecated use boosterConfig */
        config?: BoosterConfig;
    }
): Profile {
    assertInitialized();
    const profile = state.profiles[profileId];
    if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
    }

    if (typeof updates.name === 'string') {
        profile.name = updates.name;
    }

    if ('color' in updates) {
        profile.color = updates.color;
    }

    if ('tags' in updates) {
        profile.tags = updates.tags ? [...updates.tags] : undefined;
    }

    const newBoosterConfig = updates.boosterConfig ?? updates.config;
    if (newBoosterConfig) {
        profile.boosterConfig = cloneBoosterConfig(newBoosterConfig);
    }

    profile.meta.updatedAt = Date.now();
    persistState();
    notifyListeners();
    return cloneProfile(profile);
}

export function deleteProfile(profileId: string): void {
    assertInitialized();
    if (!state.profiles[profileId]) {
        return;
    }

    if (state.activeProfileId === profileId) {
        throw new Error('Cannot delete the active profile. Switch profiles first.');
    }

    delete state.profiles[profileId];
    state.order = state.order.filter(id => id !== profileId);
    persistState();
    notifyListeners();
}

export function setProfilesOrder(order: string[]): void {
    assertInitialized();
    const filteredOrder = order.filter(id => state.profiles[id]);

    if (filteredOrder.length !== state.order.length) {
        const missingIds = state.order.filter(id => !filteredOrder.includes(id));
        state.order = [...filteredOrder, ...missingIds];
    } else {
        state.order = filteredOrder;
    }

    persistState();
    notifyListeners();
}

export function setProfilesUiEnabled(enabled: boolean): void {
    assertInitialized();
    if (state.uiEnabled === enabled) return;
    state.uiEnabled = enabled;
    persistState();
    notifyListeners();
}

export function markDirtyBoosterConfig(config: BoosterConfig): void {
    assertInitialized();
    state.dirtyBoosterConfig = cloneBoosterConfig(config);
    notifyListeners();
}

/** @deprecated use markDirtyBoosterConfig */
export const markDirtyConfig = markDirtyBoosterConfig;

export function clearDirtyBoosterConfig(): void {
    assertInitialized();
    if (!state.dirtyBoosterConfig) return;
    state.dirtyBoosterConfig = null;
    notifyListeners();
}

/** @deprecated use clearDirtyBoosterConfig */
export const clearDirtyConfig = clearDirtyBoosterConfig;

export function saveActiveProfileBoosterConfig(config: BoosterConfig): Profile {
    assertInitialized();
    if (!state.activeProfileId) {
        throw new Error('No active profile to update.');
    }

    const profile = state.profiles[state.activeProfileId];
    if (!profile) {
        throw new Error('Active profile is missing.');
    }

    profile.boosterConfig = cloneBoosterConfig(config);
    profile.meta.updatedAt = Date.now();
    state.dirtyBoosterConfig = null;
    persistState();
    notifyListeners();
    return cloneProfile(profile);
}

/** @deprecated use saveActiveProfileBoosterConfig */
export const saveActiveProfileConfig = saveActiveProfileBoosterConfig;

/**
 * מחזיר את הגדרות-משחק (wrapped) של הפרופיל הפעיל לפי gameId.
 */
export function getActiveProfileGameSettings(
    gameId: string,
): { schemaVersion: number; data: unknown } | undefined {
    if (!state.activeProfileId) return undefined;
    const profile = state.profiles[state.activeProfileId];
    if (!profile) return undefined;
    return profile.gameSettings?.[gameId];
}

/**
 * שומר הגדרות-משחק (wrapped) בפרופיל הפעיל. מחזיר את ה-Profile המעודכן.
 */
export function setActiveProfileGameSettings(
    gameId: string,
    wrapped: { schemaVersion: number; data: unknown },
): Profile {
    assertInitialized();
    if (!state.activeProfileId) {
        throw new Error('No active profile to update game settings for.');
    }

    const profile = state.profiles[state.activeProfileId];
    if (!profile) {
        throw new Error('Active profile is missing.');
    }

    if (!profile.gameSettings) {
        profile.gameSettings = {};
    }
    profile.gameSettings[gameId] = wrapped;
    profile.meta.updatedAt = Date.now();
    persistState();
    notifyListeners();
    return cloneProfile(profile);
}

/** שומר את כל שכבות המשחק בכתיבת state אחת ומשאיר ערכים בזיכרון גם בכשל אחסון. */
export function replaceGameSettings(
    gameId: string,
    general: GameSettingsEntry | undefined,
    overrides: Record<string, GameSettingsEntry | undefined> = {},
): Result<void, ValidationError> {
    hydrateProfiles();
    if (general) state.generalGameSettings[gameId] = structuredClone(general);
    for (const [id, wrapped] of Object.entries(overrides)) {
        const profile = state.profiles[id];
        if (!profile) continue;
        if (wrapped) (profile.gameSettings ??= {})[gameId] = structuredClone(wrapped);
        else if (profile.gameSettings) {
            delete profile.gameSettings[gameId];
            if (!Object.keys(profile.gameSettings).length) delete profile.gameSettings;
        }
    }
    const saved = persistProfilesState();
    notifyListeners();
    return saved;
}

export function exportProfiles(): ProfilesExportPayload {
    assertInitialized();
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        profiles: state.order.map(id => state.profiles[id]).filter(Boolean).map(cloneProfile),
        generalGameSettings: structuredClone(state.generalGameSettings),
        activeProfileId: state.activeProfileId,
        uiEnabled: state.uiEnabled,
    };
}

export function importProfiles(payload: unknown, options: { replace?: boolean } = {}): ProfilesState {
    assertInitialized();
    // מעטפת הייצוא הישנה נבדקת לפני אותה שרשרת migration של אחסון הפרופילים.
    const envelope = type({ schemaVersion: 'number', profiles: 'unknown[]',
        activeProfileId: 'string | null', uiEnabled: 'boolean' })(payload);
    if (envelope instanceof type.errors) throw new Error(`Invalid import payload: ${envelope.summary}`);
    if (![2, STATE_SCHEMA_VERSION].includes(envelope.schemaVersion)) {
        throw new Error(`Unsupported profiles schema version: ${envelope.schemaVersion}`);
    }
    const checked = envelope.schemaVersion === 2
        ? ProfilesExportPayloadSchema.omit('generalGameSettings')(payload)
        : ProfilesExportPayloadSchema(payload);
    if (checked instanceof type.errors) throw new Error(`Invalid import payload: ${checked.summary}`);
    const migrated = runStateMigrations({ ...checked,
        profiles: Object.fromEntries(checked.profiles.map(profile => [profile.id, profile])),
        order: [], dirtyBoosterConfig: null,
    });
    migrateStoredGameSettings(migrated);
    const result = ProfilesExportPayloadSchema({ ...migrated, profiles: Object.values(migrated.profiles) });
    if (result instanceof type.errors) throw new Error(`Invalid import payload: ${result.summary}`);
    const validPayload = result;
    const nextState = options.replace ? createEmptyState() : cloneState(state);
    nextState.uiEnabled = validPayload.uiEnabled;
    nextState.generalGameSettings = { ...nextState.generalGameSettings, ...validPayload.generalGameSettings };
    for (const profile of validPayload.profiles) {
        nextState.profiles[profile.id] = cloneProfile(profile);
        if (!nextState.order.includes(profile.id)) nextState.order.push(profile.id);
    }
    nextState.activeProfileId = validPayload.activeProfileId && nextState.profiles[validPayload.activeProfileId]
        ? validPayload.activeProfileId : nextState.order[0] ?? null;
    nextState.dirtyBoosterConfig = null;
    state = normalizeState(nextState);
    persistState();
    notifyListeners();
    return getProfilesState();
}

function notifyListeners(): void {
    const snapshot = getProfilesState();
    listeners.forEach(listener => listener(snapshot));
}

function migrateProfilesStorage(): void {
    if (!isStorageAvailable()) return;
    try {
        const old = localStorage.getItem(OLD_STORAGE_KEY);
        if (old) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, old);
            }
            localStorage.removeItem(OLD_STORAGE_KEY);
        }
    } catch {
        // ignore storage errors
    }
}

/** כתיבה שניתנת לבדיקה; מקור מיושן נמחק רק אחרי setItem מוצלח של היעד. */
export function persistProfilesState(): Result<void, ValidationError> {
    state = normalizeState(state);
    try {
        if (!isStorageAvailable()) return err({ kind: 'validation', summary: 'Profiles storage is unavailable' });
        if (legacyBackup) localStorage.setItem('learn-booster-config:invalid-backup', legacyBackup.raw);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        legacyBackup = undefined;
        localStorage.removeItem('learn-booster-config');
        return ok(undefined);
    } catch (error) {
        return err({ kind: 'validation', summary: `Failed to save profiles: ${String(error)}` });
    }
}

function persistState(): void {
    const result = persistProfilesState();
    if (result.isErr()) console.warn(result.error.summary);
}

/** מיגרציה של מסמך מלא והשוואה אליו מונעת הוספת defaults לדריסה חלקית. */
function migrateStoredGameSettings(value: ProfilesState): void {
    const ids = new Set(Object.keys(value.generalGameSettings ?? {}));
    for (const profile of Object.values(value.profiles ?? {})) {
        Object.keys(profile.gameSettings ?? {}).forEach(id => ids.add(id));
    }
    value.generalGameSettings ??= {};
    for (const gameId of ids) {
        try {
            const base = value.generalGameSettings[gameId];
            const migratedBase = base ? runGameSettingsMigrations(gameId, base) : undefined;
            const updates: Record<string, GameSettingsEntry | undefined> = {};
            for (const [id, profile] of Object.entries(value.profiles ?? {})) {
                const override = profile.gameSettings?.[gameId];
                if (!override) continue;
                const full = runGameSettingsMigrations(gameId, {
                    schemaVersion: override.schemaVersion,
                    data: { ...asSettingsRecord(base?.data), ...asSettingsRecord(override.data) },
                });
                const data = diffSettings(asSettingsRecord(migratedBase?.data), asSettingsRecord(full.data));
                updates[id] = Object.keys(data).length ? { schemaVersion: full.schemaVersion, data } : undefined;
            }
            // מיגרציה שנכשלה אינה מוחקת את המשחק או את הפרופילים האחרים.
            for (const [id, wrapped] of Object.entries(updates)) {
                if (wrapped) value.profiles[id].gameSettings![gameId] = wrapped;
                else delete value.profiles[id].gameSettings![gameId];
            }
            if (migratedBase) value.generalGameSettings[gameId] = migratedBase;
        } catch (error) {
            console.warn(`Game settings migration failed for ${gameId}; preserving stored entries:`, error);
        }
    }
}

function loadFromStorage(): boolean {
    migrateProfilesStorage();
    if (!isStorageAvailable()) return false;
    let exists = false;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return false;
        exists = true;
        const migrated = runStateMigrations(JSON.parse(raw));
        for (const profile of Object.values(migrated.profiles ?? {}) as Profile[]) {
            if (profile.boosterConfig) profile.boosterConfig = runBoosterConfigMigrations(profile.boosterConfig);
        }
        migrateStoredGameSettings(migrated);
        const result = ProfilesStateSchema(migrated);
        if (result instanceof type.errors) {
            console.warn('Profiles storage has validation issues after migration:', result.summary);
            state = normalizeState(migrated);
        } else state = normalizeState(result);
    } catch (error) {
        console.error('Failed to load profiles from storage:', error);
        state = createEmptyState();
    }
    return exists;
}

function normalizeState(value: Partial<ProfilesState>): ProfilesState {
    const normalized: ProfilesState = {
        schemaVersion: STATE_SCHEMA_VERSION,
        profiles: {},
        generalGameSettings: structuredClone(value.generalGameSettings ?? {}),
        order: [],
        activeProfileId: null,
        uiEnabled: Boolean(value.uiEnabled),
        dirtyBoosterConfig: null,
    };

    if (value.profiles && typeof value.profiles === 'object') {
        for (const [id, profile] of Object.entries(value.profiles)) {
            if (!profile) continue;
            normalized.profiles[id] = buildProfile({
                id: profile.id,
                name: profile.name ?? DEFAULT_PROFILE_NAME,
                color: profile.color,
                tags: profile.tags,
                boosterConfig: profile.boosterConfig ?? (value.dirtyBoosterConfig ?? buildFallbackBoosterConfig()),
                gameSettings: profile.gameSettings,
                createdAt: profile.meta?.createdAt,
                updatedAt: profile.meta?.updatedAt,
            });
        }
    }

    if (Array.isArray(value.order)) {
        normalized.order = value.order.filter(id => normalized.profiles[id]);
    }

    for (const id of Object.keys(normalized.profiles)) {
        if (!normalized.order.includes(id)) {
            normalized.order.push(id);
        }
    }

    if (normalized.order.length === 0) {
        normalized.activeProfileId = null;
    } else {
        const candidate = value.activeProfileId;
        normalized.activeProfileId = candidate && normalized.profiles[candidate]
            ? candidate
            : normalized.order[0];
    }

    return normalized;
}

function cloneState(value: ProfilesState): ProfilesState {
    return {
        schemaVersion: value.schemaVersion,
        generalGameSettings: structuredClone(value.generalGameSettings),
        profiles: Object.fromEntries(
            Object.entries(value.profiles).map(([id, profile]) => [id, cloneProfile(profile)]),
        ),
        order: [...value.order],
        activeProfileId: value.activeProfileId,
        uiEnabled: value.uiEnabled,
        dirtyBoosterConfig: value.dirtyBoosterConfig ? cloneBoosterConfig(value.dirtyBoosterConfig) : null,
    };
}

function buildProfile(options: {
    id?: string;
    name: string;
    boosterConfig: BoosterConfig;
    gameSettings?: Record<string, { schemaVersion: number; data: unknown }>;
    color?: string;
    tags?: string[];
    createdAt?: number;
    updatedAt?: number;
}): Profile {
    const createdAt = options.createdAt ?? Date.now();
    const updatedAt = options.updatedAt ?? createdAt;

    const profile: Profile = {
        id: options.id ?? createProfileId(),
        name: options.name || DEFAULT_PROFILE_NAME,
        boosterConfig: cloneBoosterConfig(options.boosterConfig),
        meta: {
            createdAt,
            updatedAt,
        },
    };

    if (options.color !== undefined) {
        profile.color = options.color;
    }
    if (options.tags !== undefined) {
        profile.tags = [...options.tags];
    }
    if (options.gameSettings && Object.keys(options.gameSettings).length > 0) {
        profile.gameSettings = structuredCloneGameSettings(options.gameSettings);
    }

    return profile;
}

function cloneProfile(profile: Profile): Profile {
    // חשוב: לא להציב undefined בשדות אופציונליים (color, tags, gameSettings) — ArkType
    // מפרש שדות אופציונליים כ"לא חייב להופיע, אבל אם מופיע חייב להיות type נכון".
    const cloned: Profile = {
        id: profile.id,
        name: profile.name,
        boosterConfig: cloneBoosterConfig(profile.boosterConfig),
        meta: { ...profile.meta },
    };
    if (profile.color !== undefined) {
        cloned.color = profile.color;
    }
    if (profile.tags !== undefined) {
        cloned.tags = [...profile.tags];
    }
    if (profile.gameSettings !== undefined) {
        cloned.gameSettings = structuredCloneGameSettings(profile.gameSettings);
    }
    return cloned;
}

function structuredCloneGameSettings(
    gs: Record<string, { schemaVersion: number; data: unknown }>,
): Record<string, { schemaVersion: number; data: unknown }> {
    return typeof structuredClone === 'function'
        ? structuredClone(gs)
        : JSON.parse(JSON.stringify(gs));
}

function cloneBoosterConfig(config: BoosterConfig): BoosterConfig {
    return typeof structuredClone === 'function'
        ? structuredClone(config)
        : JSON.parse(JSON.stringify(config));
}

function buildFallbackBoosterConfig(): BoosterConfig {
    return getDefaultBoosterConfig();
}

function assertInitialized(): void {
    if (!isInitialized) {
        throw new Error('Profile manager was not initialized. Call initializeProfiles() first.');
    }
}

function isStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
        return false;
    }
}

function createEmptyState(): ProfilesState {
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        profiles: {},
        generalGameSettings: {},
        order: [],
        activeProfileId: null,
        uiEnabled: false,
        dirtyBoosterConfig: null,
    };
}

function createProfileId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `profile-${Math.random().toString(36).slice(2, 11)}`;
}

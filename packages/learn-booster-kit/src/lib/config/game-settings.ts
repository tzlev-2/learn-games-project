import { type } from 'arktype';
import { ok, err, type Result, type ValidationError } from '../result';
import type { GameSettingsEntry } from '../../schemas';
import { addProfilesListener, getProfilesState, hydrateProfiles, persistProfilesState, replaceGameSettings } from './profile-manager';
import { registerGameSchema, runGameSettingsMigrations } from './migrations';
import { asSettingsRecord, diffSettings, resolveGameSettings, settingsEqual } from './game-settings-core';
export { resolveGameSettings, diffSettings, migrateStateV2toV3 } from './game-settings-core';

export type GameSettingsScope = 'general' | 'profile';

export interface GameSettingsHandle<T extends object> {
  get(): T;
  getGeneral(): T;
  getOverride(): Partial<T>;
  overriddenKeys(): (keyof T)[];
  set(patch: Partial<T>, scope: GameSettingsScope): Result<T, ValidationError>;
  clearOverride(key?: keyof T): Result<T, ValidationError>;
  subscribe(cb: (value: T) => void): () => void;
}

export interface GameSettingsDefinition<T extends object> {
  gameId: string;
  defaults: T;
  schema: (value: unknown) => T | InstanceType<typeof type.errors>;
  currentVersion: number;
  /** כמו registerGameSchema: צעד אחד מגרסת הנתונים הנתונה לגרסה הבאה. */
  migrate: (oldData: unknown, oldVersion: number) => unknown;
  legacyStorageKey?: string;
  /** ממיר מסמך פרטי ישן למסמך הגדרות בגרסה הנוכחית. */
  migrateLegacy?: (oldData: unknown) => unknown;
}

/** יוצר הגדרות מוקלדות וטעינה סינכרונית, לפני init של המחזק. */
export function defineGameSettings<T extends object>(definition: GameSettingsDefinition<T>): GameSettingsHandle<T> {
  const { gameId, defaults, schema, currentVersion } = definition;
  registerGameSchema(gameId, definition);
  let ready = false;
  const validate = (value: unknown): Result<T, ValidationError> => {
    try {
      const result = schema(value);
      return result instanceof type.errors
        ? err({ kind: 'validation', summary: result.summary }) : ok(structuredClone(result));
    } catch (error) {
      return err({ kind: 'validation', summary: String(error) });
    }
  };
  const wrapped = (data: unknown): GameSettingsEntry => ({ schemaVersion: currentVersion, data });

  function prepare(): void {
    if (ready || typeof window === 'undefined') return;
    ready = true;
    hydrateProfiles();
    // רישום מאוחר עדיין ממגר את הכללי ואת כל הדריסות על בסיס מסמך מלא.
    const state = getProfilesState();
    const oldBase = state.generalGameSettings[gameId];
    const overrides: Record<string, GameSettingsEntry | undefined> = {};
    try {
      const migrateFull = (entry: GameSettingsEntry) => {
        const migrated = runGameSettingsMigrations(gameId, entry);
        return validate(resolveGameSettings(defaults, asSettingsRecord(migrated.data) as Partial<T>));
      };
      const migratedBase = oldBase ? migrateFull(oldBase) : ok(structuredClone(defaults));
      if (migratedBase.isErr()) {
        console.warn(`[settings:${gameId}] ${migratedBase.error.summary}`);
        return;
      }
      const base = migratedBase.value;
      for (const [id, profile] of Object.entries(state.profiles)) {
        const old = profile.gameSettings?.[gameId];
        if (!old) continue;
        const full = migrateFull({ schemaVersion: old.schemaVersion,
          data: { ...asSettingsRecord(oldBase?.data), ...asSettingsRecord(old.data) } });
        if (full.isErr()) { console.warn(`[settings:${gameId}] ${full.error.summary}`); continue; }
        const data = diffSettings(base, full.value);
        overrides[id] = Object.keys(data).length ? wrapped(data) : undefined;
      }
      if (oldBase || Object.keys(overrides).length) {
        const result = replaceGameSettings(gameId, oldBase ? wrapped(base) : undefined, overrides);
        if (result.isErr()) console.warn(result.error.summary);
      }
      const result = migrateLegacyStorage();
      if (result.isErr()) console.warn(`[settings:${gameId}] ${result.error.summary}`);
    } catch (error) { console.warn(`[settings:${gameId}] Migration failed:`, error); }
  }

  function migrateLegacyStorage(): Result<void, ValidationError> {
    const key = definition.legacyStorageKey;
    if (!key) return ok(undefined);
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return ok(undefined);
      let saved: Result<void, ValidationError>;
      if (getProfilesState().generalGameSettings[gameId]) {
        // כתיבה קודמת אולי נכשלה; המחיקה מותנית גם כאן ביעד שמור.
        saved = persistProfilesState();
      } else {
        let data = structuredClone(defaults);
        try {
          const parsed: unknown = JSON.parse(raw);
          const migrated = definition.migrateLegacy
            ? definition.migrateLegacy(parsed)
            : runGameSettingsMigrations(gameId, { schemaVersion: 1, data: parsed }).data;
          const checked = validate(migrated);
          if (checked.isErr()) throw new Error(checked.error.summary);
          data = checked.value;
        } catch (error) {
          console.warn(`[settings:${gameId}] Invalid legacy settings, using defaults:`, error);
          localStorage.setItem(`${key}:invalid-backup`, raw);
        }
        saved = replaceGameSettings(gameId, wrapped(data));
      }
      if (saved.isErr()) return saved;
      localStorage.removeItem(key);
      return ok(undefined);
    } catch (error) {
      return err({ kind: 'validation', summary: `Legacy storage migration failed: ${String(error)}` });
    }
  }

  function getGeneral(): T {
    prepare();
    const value = getProfilesState().generalGameSettings[gameId]?.data;
    const checked = validate(resolveGameSettings(defaults, asSettingsRecord(value) as Partial<T>));
    return checked.isOk() ? checked.value : structuredClone(defaults);
  }
  function getOverride(): Partial<T> {
    prepare();
    const state = getProfilesState();
    const data = state.activeProfileId ? state.profiles[state.activeProfileId]?.gameSettings?.[gameId]?.data : undefined;
    return structuredClone(asSettingsRecord(data)) as Partial<T>;
  }
  function get(): T {
    const checked = validate(resolveGameSettings(getGeneral(), {}, getOverride()));
    return checked.isOk() ? checked.value : getGeneral();
  }
  function saveOverride(data: Partial<T>): Result<T, ValidationError> {
    const state = getProfilesState();
    if (!state.activeProfileId) return err({ kind: 'validation', summary: 'No active profile' });
    const saved = replaceGameSettings(gameId, undefined, {
      [state.activeProfileId]: Object.keys(data).length ? wrapped(data) : undefined,
    });
    return saved.map(() => get());
  }
  const handle: GameSettingsHandle<T> = {
    get, getGeneral, getOverride,
    overriddenKeys: () => Object.keys(getOverride()) as (keyof T)[],
    set(patch, scope) {
      prepare();
      const state = getProfilesState();
      const actualScope = state.uiEnabled ? scope : 'general';
      const general = getGeneral();
      const checked = validate(resolveGameSettings(actualScope === 'general' ? general : get(), patch));
      if (checked.isErr()) return checked;
      if (actualScope === 'profile') return saveOverride(diffSettings(general, checked.value));
      return replaceGameSettings(gameId, wrapped(checked.value)).map(() => get());
    },
    clearOverride(key) {
      prepare();
      const data = getOverride();
      if (key === undefined) return saveOverride({});
      delete data[key];
      const checked = validate(resolveGameSettings(getGeneral(), {}, data));
      return checked.isErr() ? checked : saveOverride(data);
    },
    subscribe(cb) {
      prepare();
      const snapshot = () => {
        const state = getProfilesState();
        return { active: state.activeProfileId, general: state.generalGameSettings[gameId], override: getOverride() };
      };
      let previous = snapshot();
      cb(get());
      return addProfilesListener(() => {
        const next = snapshot();
        if (!settingsEqual(previous, next)) { previous = next; cb(get()); }
      });
    },
  };
  prepare();
  return handle;
}

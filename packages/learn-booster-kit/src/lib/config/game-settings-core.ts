import type { GameSettingsEntry } from '../../schemas';

/** מיזוג שטוח; ערך מקונן נחשב שדה אחד ומוחלף בשלמותו. */
export function resolveGameSettings<T extends object>(
  defaults: T, general: Partial<T> = {}, override: Partial<T> = {},
): T {
  return structuredClone({ ...defaults, ...general, ...override });
}

/** השוואה מבנית שאינה תלויה בסדר המפתחות באובייקט. */
export function settingsEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const a = Object.keys(left), b = Object.keys(right);
  return a.length === b.length && a.every(key => Object.hasOwn(right, key)
    && settingsEqual(Reflect.get(left, key), Reflect.get(right, key)));
}

/** מחזיר רק שדות עליונים שערכם שונה מהבסיס. */
export function diffSettings<T extends object>(base: T, value: Partial<T>): Partial<T> {
  return structuredClone(Object.fromEntries(Object.entries(value)
    .filter(([key, item]) => !settingsEqual(Reflect.get(base, key), item)))) as Partial<T>;
}

interface MigratableState {
  schemaVersion: number;
  activeProfileId?: string | null;
  profiles?: Record<string, { gameSettings?: Record<string, GameSettingsEntry> }>;
  generalGameSettings?: Record<string, GameSettingsEntry>;
}

/** מעביר את הגדרות הפעיל לכללי ושומר בכל פרופיל רק את ההפרש, בלי שינוי הקלט. */
export function migrateStateV2toV3<T extends MigratableState>(input: T): T & {
  generalGameSettings: Record<string, GameSettingsEntry>;
} {
  const state = structuredClone(input);
  const generalGameSettings = state.generalGameSettings ?? {};
  const profiles = state.profiles ?? {};
  const active = state.activeProfileId ? profiles[state.activeProfileId] : undefined;
  for (const [gameId, wrapped] of Object.entries(active?.gameSettings ?? {})) {
    generalGameSettings[gameId] ??= structuredClone(wrapped);
  }
  for (const profile of Object.values(profiles)) {
    const overrides: Record<string, GameSettingsEntry> = {};
    for (const [gameId, wrapped] of Object.entries(profile.gameSettings ?? {})) {
      const base = generalGameSettings[gameId]?.data ?? {};
      const data = diffSettings(asSettingsRecord(base), asSettingsRecord(wrapped.data));
      if (Object.keys(data).length) overrides[gameId] = { ...wrapped, data };
    }
    if (Object.keys(overrides).length) profile.gameSettings = overrides;
    else delete profile.gameSettings;
  }
  return { ...state, schemaVersion: 3, generalGameSettings };
}

/** הגדרות שמורות חייבות להיות אובייקט; תוכן המשחק מאומת בסכמה שלו. */
export function asSettingsRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { type } from 'arktype';
import { defineGameSettings, diffSettings, resolveGameSettings, migrateStateV2toV3 } from '../src/lib/config/game-settings';
import * as pm from '../src/lib/config/profile-manager';
import { _clearGameSchemaRegistryForTesting } from '../src/lib/config/migrations';
import { getDefaultBoosterConfig } from '../src/lib/config/default-config';
import { getGameSettings, initializeConfig, updateConfig, updateGameSettings } from '../src/lib/config/config-manager';

const KEY = 'learn-booster-profiles:v1';
const LEGACY = 'passcode-practice-settings';
const defaults: typeof schema.infer = { cooldownMs: 3000, voiceEnabled: true, contentSelections: { letters: ['a'], vowels: ['x'] } };
const schema = type({ cooldownMs: 'number >= 0', voiceEnabled: 'boolean', contentSelections: { letters: 'string[]', 'vowels?': 'string[]' } });
const define = (extra = {}) => defineGameSettings({ gameId: 'sample', defaults, schema, currentVersion: 1, migrate: d => d, ...extra });
const readStored = () => JSON.parse(localStorage.getItem(KEY)!);
const profile = (id: string, data: object) => ({ id, name: id, boosterConfig: getDefaultBoosterConfig(),
  gameSettings: { sample: { schemaVersion: 1, data } }, meta: { createdAt: 1, updatedAt: 1 } });
const v2 = () => ({ schemaVersion: 2, profiles: { active: profile('active', defaults), same: profile('same', structuredClone(defaults)),
  other: profile('other', { ...defaults, cooldownMs: 9000, contentSelections: { letters: ['b'] } }) },
  order: ['active', 'same', 'other'], activeProfileId: 'active', uiEnabled: true, dirtyBoosterConfig: null });

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); pm._resetProfilesStateForTesting(); _clearGameSchemaRegistryForTesting(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('general settings and partial overrides', () => {
  it('resolves defaults, general, and override with shallow nested replacement and no input mutation', () => {
    const general = { cooldownMs: 2000, contentSelections: { letters: ['b'] } };
    const override = { cooldownMs: 5000 };
    const resolved = resolveGameSettings(defaults, general, override);
    expect(resolved).toEqual({ ...defaults, ...general, ...override });
    expect(resolved.contentSelections).toEqual({ letters: ['b'] });
    resolved.contentSelections.letters.push('c');
    expect(general.contentSelections.letters).toEqual(['b']);
  });

  it('diff compares nested values structurally without depending on key order', () => {
    expect(diffSettings({ a: { x: 1, y: 2 }, b: 1 }, { a: { y: 2, x: 1 }, b: 3 })).toEqual({ b: 3 });
  });

  it('hydrates persisted values synchronously before booster init and never reloads them at init', async () => {
    localStorage.setItem(KEY, JSON.stringify(v2()));
    const handle = define();
    expect(handle.get()).toEqual(defaults);
    expect(handle.getGeneral()).toEqual(defaults);
    pm.setActiveProfile('other');
    expect(handle.get().cooldownMs).toBe(9000);
    await initializeConfig();
    expect(handle.get().cooldownMs).toBe(9000);
    expect(readStored().schemaVersion).toBe(3);
  });

  it('writes by scope, preserves other profiles and games, and clears one or all overrides', () => {
    const handle = define();
    const first = pm.getActiveProfile()!.id;
    pm.setProfilesUiEnabled(true);
    expect(handle.set({ cooldownMs: 1000 }, 'general').isOk()).toBe(true);
    const second = pm.createProfile({ name: 'second' });
    pm.setActiveProfile(second.id);
    expect(handle.get().cooldownMs).toBe(1000);
    handle.set({ cooldownMs: 8000, voiceEnabled: false }, 'profile');
    expect(handle.getOverride()).toEqual({ cooldownMs: 8000, voiceEnabled: false });
    expect(handle.overriddenKeys()).toEqual(['cooldownMs', 'voiceEnabled']);
    handle.set({ contentSelections: { letters: ['b'], vowels: ['y'] } }, 'general');
    expect(handle.get().cooldownMs).toBe(8000);
    handle.clearOverride('cooldownMs');
    expect(handle.getOverride()).toEqual({ voiceEnabled: false });
    expect(handle.get().cooldownMs).toBe(1000);
    handle.clearOverride();
    expect(handle.overriddenKeys()).toEqual([]);
    expect(readStored().profiles[second.id].gameSettings).toBeUndefined();
    pm.setActiveProfile(first);
    expect(handle.get()).toEqual(handle.getGeneral());
  });

  it('edits general when profiles are hidden while still applying stored overrides', () => {
    localStorage.setItem(KEY, JSON.stringify(v2()));
    const handle = define();
    pm.setActiveProfile('other');
    pm.setProfilesUiEnabled(false);
    handle.set({ voiceEnabled: false }, 'profile');
    expect(handle.getGeneral().voiceEnabled).toBe(false);
    expect(handle.getOverride().cooldownMs).toBe(9000);
    expect(handle.get().cooldownMs).toBe(9000);
  });

  it('validates without changing memory or storage when a patch is invalid', () => {
    const handle = define();
    const previous = localStorage.getItem(KEY);
    expect(handle.set({ cooldownMs: -1 }, 'general').isErr()).toBe(true);
    expect(handle.get()).toEqual(defaults);
    expect(localStorage.getItem(KEY)).toBe(previous);
  });

  it('subscribes immediately, on general changes and profile switches; skips unrelated changes and unsubscribes', () => {
    const handle = define();
    const cb = vi.fn();
    const unsub = handle.subscribe(cb);
    expect(cb).toHaveBeenCalledOnce();
    handle.set({ cooldownMs: 4000 }, 'general');
    expect(cb).toHaveBeenLastCalledWith({ ...defaults, cooldownMs: 4000 });
    const second = pm.createProfile({ name: 'second' });
    expect(cb).toHaveBeenCalledTimes(2);
    pm.setActiveProfile(second.id);
    expect(cb).toHaveBeenCalledTimes(3);
    defineGameSettings({ gameId: 'unrelated', defaults, schema, currentVersion: 1, migrate: d => d }).set({ voiceEnabled: false }, 'general');
    expect(cb).toHaveBeenCalledTimes(3);
    unsub();
    handle.set({ cooldownMs: 5000 }, 'general');
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('returns err on storage failure, retains values in memory, and leaves persisted data untouched', () => {
    const handle = define();
    const previous = localStorage.getItem(KEY);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const result = handle.set({ cooldownMs: 9999 }, 'general');
    expect(result.isErr()).toBe(true);
    expect(handle.get().cooldownMs).toBe(9999);
    expect(localStorage.getItem(KEY)).toBe(previous);
  });
});

describe('state migration and import/export', () => {
  it('migrates three profiles: active becomes general, equal loses entry, different keeps only two fields', () => {
    const input = v2();
    const snapshot = structuredClone(input);
    const result = migrateStateV2toV3(input);
    expect(result.schemaVersion).toBe(3);
    expect(result.generalGameSettings.sample.data).toEqual(defaults);
    expect(result.profiles.active.gameSettings).toBeUndefined();
    expect(result.profiles.same.gameSettings).toBeUndefined();
    expect(result.profiles.other.gameSettings.sample.data).toEqual({ cooldownMs: 9000, contentSelections: { letters: ['b'] } });
    expect(input).toEqual(snapshot);
  });

  it('preserves games existing only on an inactive profile when no active general exists', () => {
    const input = v2();
    delete (input.profiles.active.gameSettings as Record<string, unknown>).sample;
    delete (input.profiles.same.gameSettings as Record<string, unknown>).sample;
    const result = migrateStateV2toV3(input);
    expect(result.generalGameSettings.sample).toBeUndefined();
    expect(result.profiles.other.gameSettings.sample.data).toEqual(input.profiles.other.gameSettings.sample.data);
  });

  it('imports payload v2 through the same migration and roundtrips general and override settings as v3', () => {
    define();
    const input = v2();
    pm.importProfiles({ schemaVersion: 2, profiles: Object.values(input.profiles), activeProfileId: 'active', uiEnabled: true }, { replace: true });
    const exported = pm.exportProfiles();
    expect(exported.schemaVersion).toBe(3);
    expect(exported.generalGameSettings.sample.data).toEqual(defaults);
    expect(exported.profiles.find(p => p.id === 'other')?.gameSettings?.sample.data).toEqual({ cooldownMs: 9000, contentSelections: { letters: ['b'] } });
    pm.importProfiles(exported, { replace: true });
    expect(pm.exportProfiles()).toEqual(exported);
    pm._resetProfilesStateForTesting();
    pm.hydrateProfiles();
    expect(pm.exportProfiles()).toEqual(exported);
  });

  it('rejects malformed v3 imports without mutating existing profiles', () => {
    define();
    const before = pm.exportProfiles();
    const { generalGameSettings: _, ...incomplete } = before;
    expect(() => pm.importProfiles(incomplete, { replace: true })).toThrow('Invalid import payload');
    expect(pm.exportProfiles()).toEqual(before);
  });

  it('migrates full documents then diffs them so newly added defaults do not become overrides', () => {
    const input = v2();
    localStorage.setItem(KEY, JSON.stringify(input));
    const nextDefaults = { ...defaults, added: true };
    const nextSchema = schema.and({ added: 'boolean' });
    const handle = defineGameSettings({ gameId: 'sample', defaults: nextDefaults, schema: nextSchema,
      currentVersion: 2, migrate: (d) => ({ ...(d as object), added: true }) });
    pm.setActiveProfile('other');
    expect(handle.getOverride()).toEqual({ cooldownMs: 9000, contentSelections: { letters: ['b'] } });
    expect(handle.get().added).toBe(true);
    expect(readStored().profiles.other.gameSettings.sample.schemaVersion).toBe(2);
  });

  it('preserves all profiles and original entries when a game migration throws', () => {
    localStorage.setItem(KEY, JSON.stringify(v2()));
    const handle = defineGameSettings({ gameId: 'sample', defaults, schema, currentVersion: 2,
      migrate: () => { throw new Error('migration bug'); } });
    expect(pm.getProfilesState().order).toEqual(v2().order);
    expect(readStored().generalGameSettings.sample).toEqual({ schemaVersion: 1, data: defaults });
    expect(handle.get()).toEqual(defaults);
  });

  it('supports registration after synchronous hydration without expanding partial overrides', () => {
    localStorage.setItem(KEY, JSON.stringify(v2()));
    pm.hydrateProfiles();
    const handle = defineGameSettings({ gameId: 'sample', defaults: { ...defaults, added: 5 }, schema: schema.and({ added: 'number' }),
      currentVersion: 2, migrate: d => ({ ...(d as object), added: 5 }) });
    pm.setActiveProfile('other');
    expect(handle.getOverride()).not.toHaveProperty('added');
    expect(handle.get().added).toBe(5);
  });
});

describe('legacy game storage protocol', () => {
  const legacyDefinition = () => define({ legacyStorageKey: LEGACY, migrateLegacy: (data: unknown) => ({ ...defaults, ...(data as object) }) });

  it('does nothing when the source is absent', () => {
    const migrate = vi.fn();
    define({ legacyStorageKey: LEGACY, migrateLegacy: migrate });
    expect(migrate).not.toHaveBeenCalled();
    expect(readStored().generalGameSettings.sample).toBeUndefined();
  });

  it('migrates, validates, writes one complete target state before deleting source, and is stable on the second load', () => {
    localStorage.setItem(LEGACY, JSON.stringify({ cooldownMs: 4321 }));
    const originalRemove = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
      if (key === LEGACY) expect(readStored().generalGameSettings.sample.data.cooldownMs).toBe(4321);
      return originalRemove.call(this, key);
    });
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    const handle = legacyDefinition();
    expect(handle.get().cooldownMs).toBe(4321);
    expect(localStorage.getItem(LEGACY)).toBeNull();
    expect(writes.mock.calls.filter(([key, value]) => key === KEY && JSON.parse(value).generalGameSettings.sample)).toHaveLength(1);
    const saved = localStorage.getItem(KEY);
    pm._resetProfilesStateForTesting();
    expect(legacyDefinition().get().cooldownMs).toBe(4321);
    expect(localStorage.getItem(KEY)).toBe(saved);
  });

  it.each(['broken-json', JSON.stringify({ cooldownMs: -1 })])('backs up invalid data and persists defaults: %s', raw => {
    localStorage.setItem(LEGACY, raw);
    const handle = legacyDefinition();
    expect(localStorage.getItem(`${LEGACY}:invalid-backup`)).toBe(raw);
    expect(localStorage.getItem(LEGACY)).toBeNull();
    expect(handle.get()).toEqual(defaults);
    expect(readStored().generalGameSettings.sample.data).toEqual(defaults);
  });

  it('keeps source when setItem fails, serves migrated memory, and retries on the next load', () => {
    localStorage.setItem(LEGACY, JSON.stringify({ cooldownMs: 1234 }));
    const original = Storage.prototype.setItem;
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === KEY && JSON.parse(value).generalGameSettings.sample) throw new Error('quota');
      return original.call(this, key, value);
    });
    expect(legacyDefinition().get().cooldownMs).toBe(1234);
    expect(localStorage.getItem(LEGACY)).not.toBeNull();
    expect(readStored().generalGameSettings.sample).toBeUndefined();
    write.mockRestore();
    pm._resetProfilesStateForTesting();
    expect(legacyDefinition().get().cooldownMs).toBe(1234);
    expect(localStorage.getItem(LEGACY)).toBeNull();
  });

  it('recovers from a simulated crash after target write and before removal without overwriting general', () => {
    localStorage.setItem(LEGACY, JSON.stringify({ cooldownMs: 1234 }));
    const original = Storage.prototype.removeItem;
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
      if (key === LEGACY) throw new Error('crash');
      return original.call(this, key);
    });
    expect(legacyDefinition().get().cooldownMs).toBe(1234);
    expect(readStored().generalGameSettings.sample.data.cooldownMs).toBe(1234);
    remove.mockRestore();
    localStorage.setItem(LEGACY, JSON.stringify({ cooldownMs: 9999 }));
    pm._resetProfilesStateForTesting();
    const migrate = vi.fn();
    const next = define({ legacyStorageKey: LEGACY, migrateLegacy: migrate });
    expect(next.get().cooldownMs).toBe(1234);
    expect(migrate).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY)).toBeNull();
  });

  it('retains invalid source if backup cannot be written', () => {
    localStorage.setItem(LEGACY, 'invalid');
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.endsWith(':invalid-backup')) throw new Error('quota');
      return original.call(this, key, value);
    });
    expect(legacyDefinition().get()).toEqual(defaults);
    expect(localStorage.getItem(LEGACY)).toBe('invalid');
  });
});

describe('retiring booster config mirror and compatibility', () => {
  it('seeds only the first default profile, deletes the mirror after save, and never writes it on update', async () => {
    localStorage.setItem('learn-booster-config', JSON.stringify({ ...getDefaultBoosterConfig(), turnsPerReward: 42 }));
    define();
    expect(pm.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(42);
    expect(localStorage.getItem('learn-booster-config')).toBeNull();
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    await initializeConfig();
    await updateConfig({ turnsPerReward: 9 });
    expect(writes.mock.calls.some(([key]) => key === 'learn-booster-config')).toBe(false);
  });

  it('does not read stale mirror if profiles already exist and deletes it after saving state', () => {
    localStorage.setItem(KEY, JSON.stringify(v2()));
    localStorage.setItem('learn-booster-config', JSON.stringify({ turnsPerReward: 987 }));
    const read = vi.spyOn(Storage.prototype, 'getItem');
    define();
    expect(read.mock.calls.some(([key]) => key === 'learn-booster-config')).toBe(false);
    expect(pm.getActiveProfile()?.boosterConfig.turnsPerReward).not.toBe(987);
    expect(localStorage.getItem('learn-booster-config')).toBeNull();
  });

  it('keeps mirror on failed profile save, then seeds again after reload', () => {
    localStorage.setItem('learn-booster-config', JSON.stringify({ ...getDefaultBoosterConfig(), turnsPerReward: 42 }));
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    define();
    expect(pm.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(42);
    expect(localStorage.getItem('learn-booster-config')).not.toBeNull();
    writes.mockRestore();
    pm._resetProfilesStateForTesting();
    define();
    expect(pm.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(42);
    expect(localStorage.getItem('learn-booster-config')).toBeNull();
  });

  it('keeps deprecated wrappers in general scope across profile switches', async () => {
    const handle = define();
    pm.setProfilesUiEnabled(true);
    handle.set({ cooldownMs: 9000 }, 'profile');
    await updateGameSettings('sample', { ...defaults, cooldownMs: 2222 });
    expect(getGameSettings('sample')).toEqual({ ...defaults, cooldownMs: 2222 });
    expect(handle.get().cooldownMs).toBe(9000);
    pm.setActiveProfile(pm.createProfile({ name: 'second' }).id);
    expect(handle.get().cooldownMs).toBe(2222);
  });
});

describe('legacy booster seed safety', () => {
  it.each(['invalid-json', JSON.stringify({ schemaVersion: 99 })])('backs up invalid or unsupported mirror and keeps defaults: %s', raw => {
    localStorage.setItem('learn-booster-config', raw);
    define();
    expect(localStorage.getItem('learn-booster-config:invalid-backup')).toBe(raw);
    expect(localStorage.getItem('learn-booster-config')).toBeNull();
    expect(pm.getActiveProfile()?.boosterConfig).toEqual(getDefaultBoosterConfig());
  });

  it('preserves existing gingim config and profiles migrations', () => {
    localStorage.setItem('gingim-booster-config', JSON.stringify({ ...getDefaultBoosterConfig(), turnsPerReward: 12 }));
    define();
    expect(pm.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(12);
    expect(localStorage.getItem('gingim-booster-config')).toBeNull();
    expect(localStorage.getItem('learn-booster-config')).toBeNull();
    pm._resetProfilesStateForTesting();
    localStorage.clear();
    localStorage.setItem('gingim-booster-profiles:v1', JSON.stringify(v2()));
    define();
    expect(pm.getProfilesState().order).toEqual(v2().order);
    expect(localStorage.getItem('gingim-booster-profiles:v1')).toBeNull();
    expect(readStored().schemaVersion).toBe(3);
  });
});

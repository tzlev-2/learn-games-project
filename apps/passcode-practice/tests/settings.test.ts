import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { type } from "arktype";
import {
  DEFAULT_SETTINGS,
  PasscodeSettingsSchema,
  migrateLegacySettings,
  settingsDefinition,
} from "../src/lib/stores/settings-schema";
import { defineGameSettings } from "../../../packages/learn-booster-kit/src/lib/config/game-settings";
import {
  _resetProfilesStateForTesting,
  createProfile,
  getProfilesState,
  setActiveProfile,
  setProfilesUiEnabled,
} from "../../../packages/learn-booster-kit/src/lib/config/profile-manager";

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  removeItem: (key: string) => {
    values.delete(key);
  },
};

beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  _resetProfilesStateForTesting();
});

afterEach(() => {
  _resetProfilesStateForTesting();
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("passcode settings migration and persistence", () => {
  it("preserves false and zero values and fills missing legacy fields", () => {
    const legacy = {
      passcode: "9876",
      showHint: false,
      cooldownMs: 0,
      hintCooldownMs: 0,
      voiceEnabled: false,
      speakDigits: true,
      boosterEnabled: false,
    };
    assert.deepEqual(migrateLegacySettings(legacy), {
      ...DEFAULT_SETTINGS,
      ...legacy,
    });
    assert.deepEqual(legacy, {
      passcode: "9876",
      showHint: false,
      cooldownMs: 0,
      hintCooldownMs: 0,
      voiceEnabled: false,
      speakDigits: true,
      boosterEnabled: false,
    });
  });

  it("rejects malformed documents and wrong runtime field types", () => {
    for (const raw of [null, [], "9876", { cooldownMs: "2000" }]) {
      assert.ok(
        PasscodeSettingsSchema(migrateLegacySettings(raw)) instanceof
          type.errors,
      );
    }
  });

  it("migrates synchronously before init and removes the private key", () => {
    storage.setItem(
      settingsDefinition.legacyStorageKey,
      JSON.stringify({ passcode: "9876", boosterEnabled: false }),
    );
    const handle = defineGameSettings(settingsDefinition);
    assert.equal(handle.get().passcode, "9876");
    assert.equal(handle.get().boosterEnabled, false);
    assert.equal(storage.getItem(settingsDefinition.legacyStorageKey), null);
    assert.deepEqual(
      getProfilesState().generalGameSettings[settingsDefinition.gameId].data,
      { ...DEFAULT_SETTINGS, passcode: "9876", boosterEnabled: false },
    );
    assert.equal(defineGameSettings(settingsDefinition).get().passcode, "9876");
  });

  it("backs up an invalid legacy field before using defaults", () => {
    const raw = JSON.stringify({ passcode: 9876 });
    storage.setItem(settingsDefinition.legacyStorageKey, raw);
    const handle = defineGameSettings(settingsDefinition);
    assert.deepEqual(handle.get(), DEFAULT_SETTINGS);
    assert.equal(storage.getItem(`${settingsDefinition.legacyStorageKey}:invalid-backup`), raw);
    assert.equal(storage.getItem(settingsDefinition.legacyStorageKey), null);
  });

  it("keeps profile overrides separate from general edits and notifies on profile switches", () => {
    const handle = defineGameSettings(settingsDefinition);
    const first = getProfilesState().activeProfileId!;
    const second = createProfile({ name: "Second" });
    setProfilesUiEnabled(true);
    assert.ok(handle.set({ cooldownMs: 4500 }, "general").isOk());
    setActiveProfile(second.id);
    assert.equal(handle.get().cooldownMs, 4500);
    assert.ok(handle.set({ passcode: "9876" }, "profile").isOk());
    assert.deepEqual(handle.overriddenKeys(), ["passcode"]);
    assert.equal(handle.getGeneral().passcode, "1234");
    assert.ok(handle.set({ voiceEnabled: false }, "general").isOk());
    assert.equal(handle.getGeneral().passcode, "1234");
    const seen: string[] = [];
    const unsubscribe = handle.subscribe((next) => seen.push(next.passcode));
    setActiveProfile(first);
    assert.equal(handle.get().passcode, "1234");
    setActiveProfile(second.id);
    assert.equal(handle.get().passcode, "9876");
    assert.ok(handle.clearOverride("passcode").isOk());
    assert.equal(handle.get().passcode, "1234");
    assert.deepEqual(seen, ["9876", "1234", "9876", "1234"]);
    unsubscribe();
    _resetProfilesStateForTesting();
    const reloaded = defineGameSettings(settingsDefinition);
    assert.equal(reloaded.get().cooldownMs, 4500);
    assert.equal(reloaded.get().voiceEnabled, false);
    assert.equal(reloaded.get().passcode, "1234");
    assert.equal(storage.getItem(settingsDefinition.legacyStorageKey), null);
  });

  it("edits general settings while profiles are hidden without copying an override", () => {
    const handle = defineGameSettings(settingsDefinition);
    setProfilesUiEnabled(true);
    handle.set({ passcode: "9876" }, "profile");
    setProfilesUiEnabled(false);
    assert.ok(handle.set({ cooldownMs: 5000 }, "general").isOk());
    assert.equal(handle.getGeneral().passcode, "1234");
    assert.equal(handle.get().passcode, "9876");
    assert.equal(handle.get().cooldownMs, 5000);
  });
});

import { type } from "arktype";
import type { GameSettingsDefinition } from "learn-booster-kit";

export const CURRENT_VERSION = 1;

export const PasscodeSettingsSchema = type({
  passcode: "string",
  showHint: "boolean",
  cooldownMs: "number >= 0",
  hintVisibleMs: "number > 0",
  hintCooldownMs: "number >= 0",
  voiceEnabled: "boolean",
  speakDigits: "boolean",
  boosterEnabled: "boolean",
});

export type PasscodeSettings = typeof PasscodeSettingsSchema.infer;

export const DEFAULT_SETTINGS: PasscodeSettings = {
  passcode: "1234",
  showHint: true,
  cooldownMs: 2000,
  hintVisibleMs: 3000,
  hintCooldownMs: 8000,
  voiceEnabled: true,
  speakDigits: false,
  boosterEnabled: true,
};

/** שומר את ערכי המסמך הישן ומשלים רק שדות חסרים, לפי המיגרציה המקורית. */
export function migrateLegacySettings(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return raw;
  const fields = raw as Record<string, unknown>;
  return {
    passcode: fields.passcode ?? DEFAULT_SETTINGS.passcode,
    showHint: fields.showHint ?? DEFAULT_SETTINGS.showHint,
    cooldownMs: fields.cooldownMs ?? DEFAULT_SETTINGS.cooldownMs,
    hintVisibleMs: fields.hintVisibleMs ?? DEFAULT_SETTINGS.hintVisibleMs,
    hintCooldownMs: fields.hintCooldownMs ?? DEFAULT_SETTINGS.hintCooldownMs,
    voiceEnabled: fields.voiceEnabled ?? DEFAULT_SETTINGS.voiceEnabled,
    speakDigits: fields.speakDigits ?? DEFAULT_SETTINGS.speakDigits,
    boosterEnabled: fields.boosterEnabled ?? DEFAULT_SETTINGS.boosterEnabled,
  };
}

export const settingsDefinition = {
  gameId: "passcode-practice",
  defaults: DEFAULT_SETTINGS,
  schema: PasscodeSettingsSchema,
  currentVersion: CURRENT_VERSION,
  migrate: (data: unknown) => data,
  legacyStorageKey: "passcode-practice-settings",
  migrateLegacy: migrateLegacySettings,
} satisfies GameSettingsDefinition<PasscodeSettings>;

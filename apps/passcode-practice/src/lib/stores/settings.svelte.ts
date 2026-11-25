import { defineGameSettings, type GameSettingsScope } from "learn-booster-kit";
import {
  CURRENT_VERSION,
  DEFAULT_SETTINGS,
  settingsDefinition,
} from "./settings-schema";

export { DEFAULT_SETTINGS } from "./settings-schema";
export type { PasscodeSettings } from "./settings-schema";

export const settingsHandle = defineGameSettings(settingsDefinition);

/** ערכים אפקטיביים לקריאה במשחק; כל כתיבה עוברת דרך הידית ותחום מפורש. */
class SettingsStore {
  passcode = $state(DEFAULT_SETTINGS.passcode);
  showHint = $state(DEFAULT_SETTINGS.showHint);
  cooldownMs = $state(DEFAULT_SETTINGS.cooldownMs);
  hintVisibleMs = $state(DEFAULT_SETTINGS.hintVisibleMs);
  hintCooldownMs = $state(DEFAULT_SETTINGS.hintCooldownMs);
  voiceEnabled = $state(DEFAULT_SETTINGS.voiceEnabled);
  speakDigits = $state(DEFAULT_SETTINGS.speakDigits);
  boosterEnabled = $state(DEFAULT_SETTINGS.boosterEnabled);

  constructor() {
    // המינוי נקרא מיד, גם לפני אתחול המחזק; הוא אינו כותב חזרה לאחסון.
    settingsHandle.subscribe((value) => {
      this.passcode = value.passcode;
      this.showHint = value.showHint;
      this.cooldownMs = value.cooldownMs;
      this.hintVisibleMs = value.hintVisibleMs;
      this.hintCooldownMs = value.hintCooldownMs;
      this.voiceEnabled = value.voiceEnabled;
      this.speakDigits = value.speakDigits;
      this.boosterEnabled = value.boosterEnabled;
    });
  }

  toJSON() {
    return { schemaVersion: CURRENT_VERSION, ...settingsHandle.get() };
  }

  /** איפוס לברירות מחדל בתחום שנבחר, בלי להעתיק דריסות אל הכללי. */
  reset(scope: GameSettingsScope) {
    return settingsHandle.set(DEFAULT_SETTINGS, scope);
  }

  /** ולידציה — רק ספרות, לפחות ספרה אחת. */
  get isPasscodeValid(): boolean {
    return /^\d+$/.test(this.passcode) && this.passcode.length >= 1;
  }
}

export const settings = new SettingsStore();

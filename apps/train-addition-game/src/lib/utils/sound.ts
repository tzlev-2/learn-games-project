/**
 * צלילי משוב — דרך `createUiSounds` של הקיט.
 * הקבצים יושבים ב-`static/sounds/ui_sounds/` של המשחק.
 */
import { createUiSounds } from "learn-booster-kit";

export const { playSuccess, playError } = createUiSounds({
  success: { src: "/sounds/ui_sounds/success.mp3", volume: 0.5 },
  error: { src: "/sounds/ui_sounds/error.wav", volume: 0.4 },
});

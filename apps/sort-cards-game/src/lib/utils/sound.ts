/**
 * צלילי משוב — דרך `createUiSounds` של הקיט.
 * הקבצים יושבים ב-`static/sounds/` של המשחק.
 */
import { createUiSounds } from "learn-booster-kit";

export const { playSuccess, playError } = createUiSounds({
  success: { src: "/sounds/success.mp3", volume: 0.5 },
  error: { src: "/sounds/error.mp3", volume: 0.4 },
});

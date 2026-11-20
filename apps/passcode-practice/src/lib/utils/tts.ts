/**
 * הקראת משוב — המשפטים של המשחק מעל `speakText` של הקיט
 * (Fully Kiosk → Web Speech → שקט).
 */
import { speakText } from "learn-booster-kit";
import { language } from "$lib/services/language";

/**
 * השמעת טקסט בעברית
 */
export function speak(text: string): void {
  void speakText(text);
}

/**
 * הקראת משוב הצלחה
 */
export function speakSuccess(): void {
  void speakText(language.ttsSuccess);
}

/**
 * הקראת משוב שגוי
 */
export function speakWrong(): void {
  void speakText(language.ttsWrong);
}

/**
 * הקראת ספרה בודדת
 */
export function speakDigit(digit: string): void {
  void speakText(digit);
}

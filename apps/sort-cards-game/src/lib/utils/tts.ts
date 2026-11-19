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
 * הקראת משוב חיובי עם הקשר
 * @param categoryName שם הקטגוריה שאליה מויין הכרטיס
 * @param cardText טקסט הכרטיס (ttsText / content)
 */
export function speakCorrect(categoryName?: string, cardText?: string): void {
  let text: string;
  if (cardText && categoryName) {
    text = `${cardText}, ${categoryName}! ${language.ttsWellDone}`;
  } else if (categoryName) {
    text = `${categoryName}! ${language.ttsWellDone}`;
  } else {
    text = language.ttsWellDone;
  }
  void speakText(text);
}

/**
 * הקראת משוב שגוי
 */
export function speakWrong(): void {
  void speakText(language.ttsWrong);
}

import { settings } from "$lib/stores/settings.svelte";
import { language } from "$lib/services/language";
import { createVoiceAssetPlayer, speakText, type VoiceAsset } from "learn-booster-kit";

/**
 * מודול הקראה — הקלטות MP3 עם fallback ל-TTS, דרך `createVoiceAssetPlayer` של הקיט.
 *
 * ההקלטות נטענות ומפוענחות פעם אחת לזיכרון (Web Audio), כך שהשמעה חוזרת מיידית.
 * נכס שעוד לא נטען מוקרא ב-TTS (Fully Kiosk → Web Speech) מהטקסט שב-language.ts.
 */

// ========================================
// הגדרות
// ========================================

/**
 * כפה שימוש ב-TTS בלבד (ללא הקלטות)
 * שנה ל-true לבדיקות או אם אין קבצי סאונד
 */
const FORCE_TTS_ONLY = false;

// נתיב לקבצי הסאונד
const SOUNDS_BASE = "/sounds/";

/** שם הקובץ (בלי .mp3) לכל נכס קולי; הטקסט ב-language.voice */
const VOICE_FILES = {
  num_0: "0",
  num_1: "1",
  num_2: "2",
  num_3: "3",
  num_4: "4",
  num_5: "5",
  num_6: "6",
  num_7: "7",
  num_8: "8",
  num_9: "9",
  num_10: "10",
  num_11: "11",
  num_12: "12",
  num_13: "13",
  num_14: "14",
  num_15: "15",
  num_16: "16",
  num_17: "17",
  num_18: "18",
  num_19: "19",
  num_20: "20",

  // מילות קישור ופעולות
  plus: "plus",
  equals: "equals",

  // תחיליות וסיומות למשפטים
  put_prefix: "put",
  add_prefix: "add",
  cars_suffix: "cars",

  // משפטים שלמים / הוראות
  put_1: "put_1_cars",
  put_2: "put_2_cars",
  put_3: "put_3_cars",
  put_4: "put_4_cars",
  put_5: "put_5_cars",

  add_1: "add_1_cars",
  add_2: "add_2_cars",
  add_3: "add_3_cars",
  add_4: "add_4_cars",

  how_many: "how_many",
  correct: "correct",
  well_done: "well_done",
  wrong: "wrong",
  try_again: "try_again",

  // שאלה מפורטת - "כמה זה X רכבות ועוד Y?"
  how_many_is: "how_many_is",
  trains_plus: "trains_plus",
} as const satisfies Record<keyof typeof language.voice, string>;

type VoiceKey = keyof typeof VOICE_FILES;

const VOICE_ASSETS = Object.fromEntries(
  (Object.keys(VOICE_FILES) as VoiceKey[]).map((key) => [
    key,
    { file: VOICE_FILES[key], text: language.voice[key] },
  ]),
) as Record<VoiceKey, VoiceAsset>;

const voice = createVoiceAssetPlayer({
  assets: VOICE_ASSETS,
  baseUrl: SOUNDS_BASE,
  forceTts: FORCE_TTS_ONLY,
});

// ========================================
// פונקציות עזר
// ========================================

function getNumberKey(n: number): VoiceKey {
  return `num_${n}` as VoiceKey;
}

function numberToText(n: number): string {
  const key = getNumberKey(n);
  return voice.has(key) ? voice.text(key) : n.toString();
}

// ========================================
// פונקציות ציבוריות
// ========================================

/**
 * השמעת הוראה לשלב בנייה A
 */
export function speakBuildA(count: number): void {
  const exactKey = `put_${count}`;

  if (voice.has(exactKey)) {
    void voice.play(exactKey);
  } else {
    const text = `${voice.text("put_prefix")} ${numberToText(count)} ${voice.text("cars_suffix")}`;
    void speakText(text);
  }
}

/**
 * השמעת הוראה לשלב הוספה B
 */
export function speakAddB(count: number): void {
  const exactKey = `add_${count}`;

  if (voice.has(exactKey)) {
    void voice.play(exactKey);
  } else {
    const text = `${voice.text("add_prefix")} ${numberToText(count)} ${voice.text("cars_suffix")}`;
    void speakText(text);
  }
}

/**
 * השמעת שאלת הבחירה
 * @param a מספר קרונות בקבוצה ראשונה
 * @param b מספר קרונות בקבוצה שנייה
 */
export function speakChooseAnswer(a?: number, b?: number): void {
  if (
    settings.detailedQuestion &&
    typeof a === "number" &&
    typeof b === "number"
  ) {
    // "כמה זה" -> num_a -> "ועוד" -> num_b
    void voice.playSequence(["how_many_is", getNumberKey(a), "plus", getNumberKey(b)]);
  } else {
    void voice.play("how_many");
  }
}

/**
 * השמעת משוב חיובי מפורט
 * מבנה: "נכון!" -> A -> "ועוד" -> B -> "שווה" -> SUM -> "כל הכבוד!"
 */
export async function speakCorrect(a?: number, b?: number): Promise<void> {
  if (typeof a !== "number" || typeof b !== "number") {
    await voice.playSequence(["correct", "well_done"]);
    return;
  }

  const sum = a + b;
  await voice.playSequence([
    "correct",
    getNumberKey(a),
    "plus",
    getNumberKey(b),
    "equals",
    getNumberKey(sum),
    "well_done",
  ]);
}

/**
 * השמעת משוב שגיאה
 */
export async function speakWrong(a: number, b: number): Promise<void> {
  await voice.playSequence(["wrong", "try_again"]);

  if (
    settings.detailedQuestion &&
    typeof a === "number" &&
    typeof b === "number"
  ) {
    // "כמה זה" -> num_a -> "רכבות, ועוד" -> num_b
    await voice.playSequence(["how_many_is", getNumberKey(a), "trains_plus", getNumberKey(b)]);
  }
}

/**
 * השמעת טקסט בעברית (TTS ישיר)
 */
export function speak(text: string): void {
  void speakText(text);
}

/**
 * טעינה מראש של כל קבצי האודיו לזיכרון (Web Audio API).
 * ניתן לקרוא פעמיים בבטחה - הטעינה תתבצע רק פעם אחת.
 */
export function preloadAllAssets(): void {
  voice.preload();
}

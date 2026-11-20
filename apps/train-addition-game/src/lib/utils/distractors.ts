import { shuffleArray } from "learn-booster-kit";

/**
 * יצירת מסיחים לתרגיל חיבור
 * האלגוריתם יוצר תשובות קרובות לנכון כדי למנוע ניחוש קל
 */

/**
 * יוצר מערך של אפשרויות תשובה מעורבב
 * @param a - מספר קרונות בקבוצה A
 * @param b - מספר קרונות בקבוצה B
 * @param count - מספר אפשרויות (2 או 3)
 * @returns מערך מעורבב של תשובות
 */
export function generateChoices(
  a: number,
  b: number,
  count: 2 | 3 = 3
): number[] {
  const correct = a + b;

  // יצירת מסיחים: correct ± 1
  let d1 = correct - 1;
  let d2 = correct + 1;

  // וידוא שהמסיחים חיוביים
  if (d1 < 1) {
    d1 = correct + 2;
  }

  // טיפול במקרים מיוחדים
  // אם d1 או d2 שווים ל-A או B (טעויות נפוצות), נשאיר אותם
  // אחרת נוסיף וריאציות

  const choices = count === 3 ? [correct, d1, d2] : [correct, d1];

  // ערבוב המערך
  return shuffleArray(choices);
}

/**
 * יצירת ערכי A ו-B אקראיים לסיבוב חדש
 */
export function generateRoundValues(
  maxA: number,
  maxB: number
): { a: number; b: number } {
  const a = Math.floor(Math.random() * maxA) + 1;
  const b = Math.floor(Math.random() * maxB) + 1;
  return { a, b };
}

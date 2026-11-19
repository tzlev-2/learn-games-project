/**
 * Deck — ייצור deck מבחירה: ציר יחיד או מכפלה קרטזית של כמה צירים.
 * כל הפונקציות טהורות (תלויות רק בקלט ובצירים).
 */
import { getAxisSelection } from "./selection";
import type { AnySelectionAxis, ContentItem, ProviderSelection, SelectionAxis } from "./types";

/**
 * הפריטים הנבחרים בציר — לפי סדר הפריטים הזמינים בציר (לא לפי סדר הבחירה).
 * מזהים לא מוכרים בבחירה מתעלמים מהם.
 */
export function selectAxisItems<T>(axis: SelectionAxis<T>, selection: ProviderSelection): ContentItem<T>[] {
  const selected = new Set(getAxisSelection(selection, axis.id));
  return axis.getAvailableItems().filter((item) => selected.has(item.id));
}

/** צירוף אחד במכפלה — axisId → הפריט שנבחר בציר */
export type AxisCombination = Readonly<Record<string, ContentItem>>;

/** המרת צירוף למזהים בלבד (axisId → itemId) — הקלט של `isValidCombination` */
export function combinationIds(combination: AxisCombination): Record<string, string> {
  const ids: Record<string, string> = {};
  for (const [axisId, item] of Object.entries(combination)) {
    ids[axisId] = item.id;
  }
  return ids;
}

/**
 * מזהה יציב לצירוף, לפי סדר הצירים: `"ב|kamatz"`.
 * צירים שלא משתתפים בצירוף (ריקים עם `allowEmpty`) מושמטים.
 */
export function combinationKey(
  combination: AxisCombination,
  axes: readonly AnySelectionAxis[],
  separator = "|",
): string {
  return axes
    .filter((axis) => combination[axis.id] !== undefined)
    .map((axis) => combination[axis.id].id)
    .join(separator);
}

/**
 * מכפלה קרטזית של הבחירה בכל הצירים, מסוננת לפי `isValid`.
 *
 * - הסדר: הציר הראשון חיצוני (כל צירופי הפריט הראשון, אחר כך השני...).
 * - ציר ריק עם `allowEmpty` לא משתתף (מושמט מהצירופים).
 * - ציר ריק בלי `allowEmpty` → אין צירופים (מערך ריק).
 * - אין צירים משתתפים → מערך ריק.
 */
export function cartesianCombinations(
  axes: readonly AnySelectionAxis[],
  selection: ProviderSelection,
  isValid?: (combination: Readonly<Record<string, string>>) => boolean,
): AxisCombination[] {
  const participating: { axisId: string; items: ContentItem[] }[] = [];
  for (const axis of axes) {
    const items = selectAxisItems(axis, selection);
    if (items.length === 0) {
      if (axis.allowEmpty) continue;
      return [];
    }
    participating.push({ axisId: axis.id, items });
  }
  if (participating.length === 0) return [];

  const combinations = participating.reduce<AxisCombination[]>(
    (acc, { axisId, items }) =>
      acc.flatMap((partial) => items.map((item) => ({ ...partial, [axisId]: item }))),
    [{}],
  );

  return isValid ? combinations.filter((c) => isValid(combinationIds(c))) : combinations;
}

/** פרמטרים ל-`generateCartesianDeck` */
export interface CartesianDeckParams<T> {
  axes: readonly AnySelectionAxis[];
  selection: ProviderSelection;
  isValidCombination?: (combination: Readonly<Record<string, string>>) => boolean;
  /** בניית פריט deck מצירוף (id, value, label) */
  toItem: (combination: AxisCombination) => ContentItem<T>;
}

/**
 * Helper ל-`generateDeck` של Provider רב-צירי:
 * מכפלה קרטזית → סינון תקינות → המרה לפריטים.
 */
export function generateCartesianDeck<T>(params: CartesianDeckParams<T>): ContentItem<T>[] {
  const { axes, selection, isValidCombination, toItem } = params;
  return cartesianCombinations(axes, selection, isValidCombination).map(toItem);
}

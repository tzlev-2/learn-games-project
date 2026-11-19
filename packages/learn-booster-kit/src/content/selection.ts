/**
 * Selection — פונקציות טהורות לעבודה עם `ProviderSelection`.
 *
 * כל הפונקציות מחזירות אובייקט חדש ולא משנות את הקלט — מתאים גם
 * לשמירה ישירה ב-`$state` של משחק וגם לבדיקות.
 */
import { type } from "arktype";
import { err, ok, type Result, type ValidationError } from "../lib/result";
import type { AnySelectionAxis, ProviderSelection } from "./types";

// ─── קריאה ──────────────────────────────────────────────────────────────────

/** הפריטים הנבחרים בציר (מערך ריק אם הציר לא קיים בבחירה) */
export function getAxisSelection(selection: ProviderSelection, axisId: string): readonly string[] {
  return selection[axisId] ?? [];
}

export function isItemSelected(selection: ProviderSelection, axisId: string, itemId: string): boolean {
  return getAxisSelection(selection, axisId).includes(itemId);
}

// ─── עדכון (immutable) ──────────────────────────────────────────────────────

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

/** קביעת הבחירה של ציר שלם */
export function setAxisSelection(
  selection: ProviderSelection,
  axisId: string,
  itemIds: readonly string[],
): ProviderSelection {
  return { ...selection, [axisId]: unique(itemIds) };
}

/**
 * הוספה/הסרה של פריט בציר.
 * `checked` לא מועבר → היפוך המצב הנוכחי. פריט נוסף לסוף הרשימה.
 */
export function toggleAxisItem(
  selection: ProviderSelection,
  axisId: string,
  itemId: string,
  checked?: boolean,
): ProviderSelection {
  const current = getAxisSelection(selection, axisId);
  const shouldSelect = checked ?? !current.includes(itemId);
  const next = shouldSelect
    ? current.includes(itemId)
      ? current
      : [...current, itemId]
    : current.filter((id) => id !== itemId);
  return setAxisSelection(selection, axisId, next);
}

/** בחירת כל הפריטים הזמינים בציר */
export function selectAllOnAxis(selection: ProviderSelection, axis: AnySelectionAxis): ProviderSelection {
  return setAxisSelection(
    selection,
    axis.id,
    axis.getAvailableItems().map((item) => item.id),
  );
}

/** ניקוי הבחירה בציר */
export function clearAxis(selection: ProviderSelection, axisId: string): ProviderSelection {
  return setAxisSelection(selection, axisId, []);
}

/**
 * המינימום שאי אפשר לרדת ממנו בעריכה אינטראקטיבית: 0 לציר `allowEmpty`
 * (ריק מותר), אחרת `minSelected` (ברירת מחדל 1).
 */
export function axisFloor(axis: AnySelectionAxis): number {
  if (axis.allowEmpty) return 0;
  return Math.max(axis.minSelected ?? 1, 0);
}

/**
 * כמו `toggleAxisItem`, אבל ביטול סימון שיוריד את הציר מתחת ל-`minSelected`
 * לא מתבצע (הבחירה מוחזרת כמו שהיא). ציר `allowEmpty` מותר להתרוקן לגמרי.
 */
export function toggleAxisItemWithinMinimum(
  selection: ProviderSelection,
  axis: AnySelectionAxis,
  itemId: string,
  checked?: boolean,
): ProviderSelection {
  const next = toggleAxisItem(selection, axis.id, itemId, checked);
  const count = getAxisSelection(next, axis.id).length;
  const shrinking = count < getAxisSelection(selection, axis.id).length;
  if (shrinking && count < requiredMinimum(axis, count)) return selection;
  return next;
}

/**
 * "נקה" שמכבד מינימום: ציר `allowEmpty` (או `minSelected: 0`) מתרוקן;
 * אחרת נשארים `minSelected` הפריטים הראשונים לפי סדר הציר.
 */
export function clearAxisToMinimum(selection: ProviderSelection, axis: AnySelectionAxis): ProviderSelection {
  const floor = axisFloor(axis);
  if (floor === 0) return clearAxis(selection, axis.id);
  const keep = axis
    .getAvailableItems()
    .slice(0, floor)
    .map((item) => item.id);
  return setAxisSelection(selection, axis.id, keep);
}

/** בחירת כל הפריטים בכל הצירים */
export function selectAllAxes(axes: readonly AnySelectionAxis[]): ProviderSelection {
  return axes.reduce<ProviderSelection>((acc, axis) => selectAllOnAxis(acc, axis), {});
}

// ─── ניקוי ו-validation ─────────────────────────────────────────────────────

/**
 * השארת צירים ופריטים מוכרים בלבד (לפי סדר הבחירה, בלי כפילויות).
 * שימושי אחרי טעינה מ-localStorage — פריט שהוסר מה-Provider לא ישבור את המשחק.
 * ציר שחסר בבחירה נשאר חסר (לא מוחלף בברירת מחדל).
 */
export function sanitizeSelection(
  axes: readonly AnySelectionAxis[],
  selection: ProviderSelection,
): ProviderSelection {
  const result: ProviderSelection = {};
  for (const axis of axes) {
    const ids = selection[axis.id];
    if (!ids) continue;
    const known = new Set(axis.getAvailableItems().map((item) => item.id));
    result[axis.id] = unique(ids.filter((id) => known.has(id)));
  }
  return result;
}

/** שגיאת בחירה — ציר שלא עומד במינימום */
export interface SelectionError {
  kind: "selection";
  reason: "below-minimum";
  axisId: string;
  /** מספר הפריטים המוכרים שנבחרו */
  selected: number;
  /** המינימום הנדרש */
  minimum: number;
  summary: string;
}

/** המינימום האפקטיבי של ציר לבחירה נתונה */
function requiredMinimum(axis: AnySelectionAxis, selectedCount: number): number {
  if (selectedCount === 0 && axis.allowEmpty) return 0;
  return Math.max(axis.minSelected ?? 1, 0);
}

/**
 * בדיקה שהבחירה עומדת בדרישות כל הצירים (`minSelected`, `allowEmpty`).
 * נספרים רק פריטים מוכרים. מחזיר את הבחירה המנוקה (`sanitizeSelection`).
 */
export function validateSelection(
  axes: readonly AnySelectionAxis[],
  selection: ProviderSelection,
): Result<ProviderSelection, SelectionError> {
  const clean = sanitizeSelection(axes, selection);
  for (const axis of axes) {
    const count = getAxisSelection(clean, axis.id).length;
    const minimum = requiredMinimum(axis, count);
    if (count < minimum) {
      return err({
        kind: "selection",
        reason: "below-minimum",
        axisId: axis.id,
        selected: count,
        minimum,
        summary: `axis "${axis.id}" has ${count} selected item(s), minimum is ${minimum}`,
      });
    }
  }
  return ok(clean);
}

/** סכמת ArkType לבחירה שמורה (קלט חיצוני) */
export const ProviderSelectionSchema = type({ "[string]": "string[]" });

/** אימות מבני של בחירה שנקראה מאחסון/JSON */
export function parseSelection(raw: unknown): Result<ProviderSelection, ValidationError> {
  const parsed = ProviderSelectionSchema(raw);
  if (parsed instanceof type.errors) {
    return err({ kind: "validation", summary: parsed.summary });
  }
  return ok(parsed);
}

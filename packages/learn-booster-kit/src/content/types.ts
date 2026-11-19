/**
 * Content — טיפוסי ה-ContentProvider הרב-צירי (platform-plan §5.3).
 *
 * ה-Provider מספק תוכן; המשחק מספק חוויה. המורה בוחר פריטים מכמה
 * "צירי בחירה" (`SelectionAxis`), והבחירה נשמרת כ-`ProviderSelection`
 * (מיפוי axisId → itemIds). ה-Provider מייצר מהבחירה deck של `ContentItem`.
 *
 * הקיט לא מכיל מחרוזות עבריות: `displayName` של Provider/ציר מגיע מהצרכן.
 */
import type { Component } from "svelte";

// ─── פריטים וכרטיסים ─────────────────────────────────────────────────────────

/** פריט תוכן בודד */
export interface ContentItem<T = unknown> {
  /** מזהה יציב — נשמר בהגדרות המורה */
  id: string;
  /** הערך עצמו (אות, הגדרת צורה, צירוף אות×תנועה...) */
  value: T;
  /** טקסט לתצוגה (מגיע מה-Provider) */
  label: string;
}

/** תוכן כרטיס במשחק — מה שה-renderComponent מקבל */
export interface CardContent {
  providerId: string;
  itemId: string;
  /** מידע ספציפי לתוכן (צבע לצורה וכו') */
  data: unknown;
}

/** אפשרויות עיצוב לכרטיס */
export interface CardStyleOptions {
  /** class CSS נוסף לכרטיס */
  className?: string;
  /** פריסת התוכן בתוך הכרטיס */
  contentLayout?: "center" | "vertical" | "horizontal";
  /** גודל פונט בסיסי (CSS value) */
  fontSize?: string;
  /** padding פנימי (CSS value) */
  padding?: string;
  /** האם להסתיר את הרקע הבסיסי של הכרטיס */
  transparentBackground?: boolean;
}

// ─── Props של קומפוננטות ה-Provider ─────────────────────────────────────────

/** props של `renderComponent` — מציג תוכן כרטיס */
export interface CardContentProps {
  content: CardContent;
}

/** props של `itemComponent` של ציר — תצוגת פריט במסך הבחירה */
export interface AxisItemProps<T = unknown> {
  item: ContentItem<T>;
  selected: boolean;
}

/** props של `settingsComponent` — הגדרות ספציפיות ל-Provider (מעבר לבחירה) */
export interface ProviderSettingsProps<TSettings = unknown> {
  settings: TSettings;
  onSettingsUpdate: (partial: Partial<TSettings>) => void;
}

// ─── צירי בחירה ─────────────────────────────────────────────────────────────

/** ציר בחירה — קטגוריה שהמורה בוחר ממנה פריטים */
export interface SelectionAxis<T = unknown> {
  /** 'letters', 'vowels', 'shapes', 'colors' */
  id: string;
  /** שם הציר לתצוגה — מגיע מה-language של הצרכן */
  displayName: string;
  icon?: string;
  getAvailableItems(): ContentItem<T>[];
  /**
   * האם מותרת בחירה ריקה. ציר ריק עם `allowEmpty` לא משתתף במכפלה
   * הקרטזית (ראה `cartesianCombinations`). ברירת מחדל: false.
   */
  allowEmpty?: boolean;
  /** מינימום פריטים כשהציר לא ריק. ברירת מחדל: 1 */
  minSelected?: number;
  /** תצוגה מותאמת לפריט במסך הבחירה (ברירת מחדל: `item.label`) */
  itemComponent?: Component<AxisItemProps<T>>;
}

/**
 * ציר בחירה עם פריטים מכל טיפוס — לרשימות הטרוגניות של צירים.
 * `any` מכוון: `itemComponent` הוא property (לא method) ולכן contravariant,
 * ו-`SelectionAxis<string>` לא היה ניתן להשמה ל-`SelectionAxis<unknown>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySelectionAxis = SelectionAxis<any>;

/** בחירת המורה — מיפוי axisId → רשימת itemIds */
export type ProviderSelection = Record<string, string[]>;

// ─── ה-Provider ─────────────────────────────────────────────────────────────

/** ספק תוכן רב-צירי */
export interface ContentProvider<TSettings = unknown, TItem = unknown> {
  /** מזהה ייחודי — נשמר בהגדרות (`contentProviderId`) */
  id: string;
  /** שם להצגה — מגיע מהצרכן/ה-Provider, לא מהקיט */
  displayName: string;
  /** אייקון (emoji) */
  icon: string;

  // === Selection axes ===
  /** צירי הבחירה. ציר אחד למשחקים פשוטים, כמה צירים למורכבים. */
  selectionAxes: readonly AnySelectionAxis[];

  // === Deck generation ===
  /** ייצור deck מהבחירה (כולל סינון פנימי). חייב להיות טהור ביחס לקלט. */
  generateDeck(selection: ProviderSelection, settings: TSettings): ContentItem<TItem>[];
  /** האם צירוף יחיד (axisId → itemId) תקין — לסינון במכפלה קרטזית */
  isValidCombination?(combination: Readonly<Record<string, string>>): boolean;

  // === Card rendering & matching ===
  generateCardContent(item: ContentItem<TItem>, settings: TSettings): CardContent;
  contentMatches(a: CardContent, b: CardContent): boolean;
  renderComponent: Component<CardContentProps>;
  /** הגדרות ספציפיות ל-Provider שאינן בחירת פריטים (למשל מצב צבעים) */
  settingsComponent?: Component<ProviderSettingsProps<TSettings>>;

  // === Defaults ===
  getDefaultSelection(): ProviderSelection;
  getDefaultSettings?(): TSettings;

  // === Optional ===
  /** איפוס מצב פנימי לפני משחק חדש (למשל מאגר צבעים) */
  prepareForGame?(): void | Promise<void>;
  cardStyles?: CardStyleOptions;
  /** טקסט להקראה (TTS) לפריט — למשחקים שמקריאים את הפריט */
  getSpeakText?(item: ContentItem<TItem>): string | null;
  /** האם שני פריטים דומים מדי כדי להופיע יחד (מסיחים) */
  areItemsSimilar?(a: ContentItem<TItem>, b: ContentItem<TItem>): boolean;
}

/**
 * Provider מכל טיפוס — ל-registry ולרשימות הטרוגניות.
 * `any` מכוון: `settingsComponent` הוא property ולכן contravariant ב-TSettings.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyContentProvider = ContentProvider<any, any>;

// ─── Type guard ─────────────────────────────────────────────────────────────

/** בדיקה מבנית אם ערך הוא ContentProvider רב-צירי */
export function isContentProvider(value: unknown): value is AnyContentProvider {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.displayName === "string" &&
    typeof p.icon === "string" &&
    Array.isArray(p.selectionAxes) &&
    typeof p.generateDeck === "function" &&
    typeof p.generateCardContent === "function" &&
    typeof p.contentMatches === "function" &&
    typeof p.getDefaultSelection === "function" &&
    typeof p.renderComponent === "function"
  );
}

// ─── UI ─────────────────────────────────────────────────────────────────────

/** מחרוזות ל-`AxisSelector` — מגיעות מה-language של המשחק */
export interface AxisSelectorLabels {
  selectAll: string;
  clearAll: string;
  /** כפתור "ברירת מחדל" — מוצג רק כשיש גם `defaultSelection` ב-AxisSelector */
  reset?: string;
}

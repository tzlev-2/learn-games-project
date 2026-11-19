/**
 * Legacy adapter — Provider ציר-יחיד בסגנון הלוטו הישן → ContentProvider רב-צירי
 * (platform-plan §5.5, providerization-plan §6).
 *
 * במודל הישן הבחירה חיה בתוך ה-settings (`getSelectedItemIds` /
 * `updateSelectedItems`). במודל החדש הבחירה היא `ProviderSelection` נפרד.
 * ה-adapter חושף ציר יחיד (ברירת מחדל `items`), ופונקציות העזר מאפשרות
 * למשחק שעדיין שומר את הצורה הישנה להמיר הלוך-חזור.
 */
import type { Component } from "svelte";
import { selectAxisItems } from "./deck";
import type {
  CardContent,
  CardStyleOptions,
  ContentItem,
  ContentProvider,
  ProviderSelection,
  SelectionAxis,
} from "./types";

/** ממשק ה-Provider הישן (ציר-יחיד, הבחירה בתוך ה-settings) */
export interface LegacyContentProvider<TItem = unknown, TSettings = unknown> {
  id: string;
  displayName: string;
  icon: string;
  getAvailableItems(): ContentItem<TItem>[];
  getDefaultSettings(): TSettings;
  prepareForGame?(): void;
  /** שים לב: מקבל את `item.value`, לא את ה-ContentItem */
  generateCardContent(item: TItem, settings: TSettings): CardContent;
  contentMatches(a: CardContent, b: CardContent): boolean;
  getSelectedItemIds(settings: TSettings): string[];
  updateSelectedItems(settings: TSettings, selectedIds: string[]): TSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- props של הקומפוננטות הישנות לא מוגדרים בחוזה
  renderComponent: Component<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingsComponent?: Component<any>;
  cardStyles?: CardStyleOptions;
}

/** ציר ברירת המחדל של ה-adapter */
export const LEGACY_AXIS_ID = "items";

export interface LegacyAdapterOptions {
  /** מזהה הציר היחיד (ברירת מחדל `items`) */
  axisId?: string;
  /** שם הציר (ברירת מחדל: displayName של ה-Provider) */
  axisDisplayName?: string;
}

/** Type guard ל-Provider ישן */
export function isLegacyContentProvider(value: unknown): value is LegacyContentProvider {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.displayName === "string" &&
    typeof p.icon === "string" &&
    typeof p.getAvailableItems === "function" &&
    typeof p.getDefaultSettings === "function" &&
    typeof p.generateCardContent === "function" &&
    typeof p.contentMatches === "function" &&
    typeof p.getSelectedItemIds === "function" &&
    typeof p.updateSelectedItems === "function" &&
    typeof p.renderComponent === "function"
  );
}

/** עטיפת Provider ישן כ-ContentProvider רב-צירי עם ציר יחיד */
export function legacyToMultiAxis<TItem, TSettings>(
  legacy: LegacyContentProvider<TItem, TSettings>,
  options: LegacyAdapterOptions = {},
): ContentProvider<TSettings, TItem> {
  const axisId = options.axisId ?? LEGACY_AXIS_ID;
  const axis: SelectionAxis<TItem> = {
    id: axisId,
    displayName: options.axisDisplayName ?? legacy.displayName,
    icon: legacy.icon,
    getAvailableItems: () => legacy.getAvailableItems(),
    minSelected: 1,
  };

  return {
    id: legacy.id,
    displayName: legacy.displayName,
    icon: legacy.icon,
    selectionAxes: [axis],
    generateDeck: (selection) => selectAxisItems(axis, selection),
    generateCardContent: (item, settings) => legacy.generateCardContent(item.value, settings),
    contentMatches: (a, b) => legacy.contentMatches(a, b),
    renderComponent: legacy.renderComponent,
    settingsComponent: legacy.settingsComponent,
    getDefaultSelection: () => ({ [axisId]: legacy.getSelectedItemIds(legacy.getDefaultSettings()) }),
    getDefaultSettings: () => legacy.getDefaultSettings(),
    prepareForGame: legacy.prepareForGame ? () => legacy.prepareForGame?.() : undefined,
    cardStyles: legacy.cardStyles,
  };
}

/** settings ישנים → `ProviderSelection` (למיגרציה או לתצוגה) */
export function legacySelectionFromSettings<TItem, TSettings>(
  legacy: LegacyContentProvider<TItem, TSettings>,
  settings: TSettings,
  axisId: string = LEGACY_AXIS_ID,
): ProviderSelection {
  return { [axisId]: legacy.getSelectedItemIds(settings) };
}

/** `ProviderSelection` → settings ישנים (למשחק שעדיין שומר את הצורה הישנה) */
export function applySelectionToLegacySettings<TItem, TSettings>(
  legacy: LegacyContentProvider<TItem, TSettings>,
  settings: TSettings,
  selection: ProviderSelection,
  axisId: string = LEGACY_AXIS_ID,
): TSettings {
  return legacy.updateSelectedItems(settings, [...(selection[axisId] ?? [])]);
}

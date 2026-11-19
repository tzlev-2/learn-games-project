/**
 * Content module — ContentProvider רב-צירי משותף (platform-plan §5).
 * תיעוד: `packages/learn-booster-kit/docs/content-provider.md`.
 */
export type {
  ContentItem,
  CardContent,
  CardStyleOptions,
  CardContentProps,
  AxisItemProps,
  ProviderSettingsProps,
  SelectionAxis,
  AnySelectionAxis,
  ProviderSelection,
  ContentProvider,
  AnyContentProvider,
  AxisSelectorLabels,
} from "./types";
export { isContentProvider } from "./types";

export {
  getAxisSelection,
  isItemSelected,
  setAxisSelection,
  toggleAxisItem,
  selectAllOnAxis,
  clearAxis,
  selectAllAxes,
  sanitizeSelection,
  validateSelection,
  parseSelection,
  ProviderSelectionSchema,
} from "./selection";
export type { SelectionError } from "./selection";

export {
  selectAxisItems,
  combinationIds,
  combinationKey,
  cartesianCombinations,
  generateCartesianDeck,
} from "./deck";
export type { AxisCombination, CartesianDeckParams } from "./deck";

export { createContentRegistry, resolveGameContent } from "./registry";
export type {
  ContentRegistry,
  ContentRegistryError,
  GameContentDeclaration,
  GameContent,
} from "./registry";

export {
  legacyToMultiAxis,
  isLegacyContentProvider,
  legacySelectionFromSettings,
  applySelectionToLegacySettings,
  LEGACY_AXIS_ID,
} from "./legacy-adapter";
export type { LegacyContentProvider, LegacyAdapterOptions } from "./legacy-adapter";

export { default as AxisSelector } from "./AxisSelector.svelte";

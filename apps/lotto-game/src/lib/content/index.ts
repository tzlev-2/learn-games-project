/**
 * ייצוא מרכזי של מערכת התוכן המודולרית
 */

// טיפוסים בסיסיים (מהקיט)
export type {
	ContentProvider,
	ContentItem,
	CardContent,
	CardStyleOptions,
	ProviderSelection
} from './types';
export { isContentProvider } from './types';

// Registry + הצהרת המשחק (הייבוא מבצע רישום של ה-Providers)
export { contentRegistry } from './registry';
export { lottoContent, LOTTO_CONTENT_DECLARATION } from './game-content';

export type {
	LettersProviderSettings,
	ShapesProviderSettings,
	ShapeDefinition,
	ReadingProviderSettings,
	ReadingItem
} from './providers';
export { SHAPES, READING_ITEMS } from './providers';

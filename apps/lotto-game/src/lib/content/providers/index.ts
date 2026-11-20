/**
 * רישום כל ספקי התוכן של הלוטו ב-registry
 */
import { contentRegistry } from '../registry';
import { lettersProvider } from './letters/index';
import { shapesProvider } from './shapes/index';
import { readingProvider } from './reading';
// תוכן משותף בין משחקים (platform-plan שלב 4): אותו אובייקט ש-find-letter צורך
import { hebrewLettersProvider } from 'learn-booster-kit/content/hebrew-letters';

// רישום ספקי התוכן
contentRegistry.register(lettersProvider);
contentRegistry.register(hebrewLettersProvider);
contentRegistry.register(shapesProvider);
contentRegistry.register(readingProvider);

// ייצוא לשימוש חיצוני
export { lettersProvider, hebrewLettersProvider, shapesProvider, readingProvider };
export { lettersAxis } from './letters/index';
export { shapesAxis } from './shapes/index';
export { readingAxis } from './reading';
export type { LettersProviderSettings } from './letters/index';
export type { ShapesProviderSettings, ShapeDefinition } from './shapes/index';
export type { ReadingProviderSettings, ReadingItem } from './reading';
export { SHAPES } from './shapes/index';
export { READING_ITEMS } from './reading';

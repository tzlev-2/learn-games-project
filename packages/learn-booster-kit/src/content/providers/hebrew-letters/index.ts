/**
 * תוכן משותף "אותיות וניקוד" — Provider + מאגר הנתונים שלו.
 *
 * ייבוא: `import { hebrewLettersProvider } from 'learn-booster-kit/content/hebrew-letters'`.
 * (subpath נפרד — כדי לא להעמיס את ה-root export של הקיט בשמות תוכן כמו `Letter`.)
 * תיעוד: packages/learn-booster-kit/docs/content-provider.md §7.
 */
export {
	hebrewLettersProvider,
	createHebrewLettersProvider,
	isValidHebrewCombination,
	pairToContentItem,
	lookupLetter,
	lookupVowel,
	HEBREW_LETTERS_PROVIDER_ID,
	LETTERS_AXIS_ID,
	VOWELS_AXIS_ID,
	MIN_SELECTED_LETTERS,
	MIN_SELECTED_VOWELS,
	DEFAULT_LETTER_IDS,
	DEFAULT_VOWEL_CODES
} from './provider';
export type {
	HebrewLettersProvider,
	HebrewLettersSettings,
	HebrewLettersLabels,
	HebrewLettersProviderOptions
} from './provider';

export {
	ALL_LETTERS_DATA,
	LETTERS_BY_LEGACY_ID,
	LETTER_IDS_ALPHABETICAL,
	LETTERS_ALPHABETICAL
} from './letters';
export type { Letter, LetterGroup } from './letters';

export { ALL_VOWELS, VOWELS_BY_CODE } from './vowels';
export type { Vowel, VowelCode } from './vowels';

export { makePair, isValidLetterVowel } from './pair';
export type { LetterVowelPair } from './pair';

export {
	areSimilar,
	PHONETIC_SIMILARITY_PAIRS,
	VISUAL_SIMILARITY_PAIRS_FUTURE
} from './similarity';
export type { SimilarityPair, SimilarityKind, SimilarityStrength } from './similarity';

export { TTS_FILES, TTS_STATIC_PATH, getTtsFilename, hasRecordedSpeech } from './tts-files';

export { hebrewLettersLanguage } from './language';

export { default as LetterPairContent } from './LetterPairContent.svelte';

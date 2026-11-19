/**
 * Provider משותף "אותיות וניקוד" (`hebrew-letters`) — שני צירים: אותיות × ניקוד.
 *
 * תוכן אחד, כמה משחקים (platform-plan שלב 4): find-letter ("איפה האות?")
 * והלוטו צורכים את אותו אובייקט — אותם פריטים, אותם צירים, אותם חוקי תקפות.
 * כל משחק מציג את הפריט בדרכו (find-letter: LetterCard משלו; לוטו:
 * `renderComponent` של ה-Provider).
 *
 * - ציר `letters`: מזהה = legacyCardId (`'ba'`, `'va_rafe'`), סדר א-ב, לפחות 2.
 * - ציר `vowels`: מזהה = VowelCode (`'patah'`, `'hirik'`), סדר פדגוגי, לפחות 1.
 * - deck = מכפלה קרטזית מסוננת ב-`isValidCombination`; מזהה פריט = `pair.id`.
 *
 * תיעוד: packages/learn-booster-kit/docs/content-provider.md §7.
 */
import { generateCartesianDeck } from '../../deck';
import type { CardContent, ContentItem, ContentProvider, SelectionAxis } from '../../types';
import { hebrewLettersLanguage } from './language';
import { LETTERS_ALPHABETICAL, LETTERS_BY_LEGACY_ID, type Letter } from './letters';
import { ALL_VOWELS, VOWELS_BY_CODE, type Vowel, type VowelCode } from './vowels';
import { isValidLetterVowel, makePair, type LetterVowelPair } from './pair';
import { areSimilar } from './similarity';
import LetterPairContent from './LetterPairContent.svelte';

export const HEBREW_LETTERS_PROVIDER_ID = 'hebrew-letters';
export const LETTERS_AXIS_ID = 'letters';
export const VOWELS_AXIS_ID = 'vowels';

/** מינימום אותיות — לוח/זוגות עם אות אחת אינם משחק */
export const MIN_SELECTED_LETTERS = 2;
/** מינימום סוגי ניקוד */
export const MIN_SELECTED_VOWELS = 1;

/** ברירת המחדל לניקוד — פתח בלבד (ההתנהגות ההיסטורית של find-letter) */
export const DEFAULT_VOWEL_CODES: readonly VowelCode[] = ['patah'];

/** ל-Provider אין הגדרות מעבר לבחירה */
export type HebrewLettersSettings = Record<string, never>;

export interface HebrewLettersLabels {
	providerName: string;
	lettersAxis: string;
	vowelsAxis: string;
}

export interface HebrewLettersProviderOptions {
	/** החלפת שמות ה-Provider והצירים (ברירת מחדל: `hebrewLettersLanguage`) */
	labels?: Partial<HebrewLettersLabels>;
	icon?: string;
}

export type HebrewLettersProvider = ContentProvider<HebrewLettersSettings, LetterVowelPair>;

function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

/** האות לפי מזהה הפריט בציר `letters` (legacyCardId) */
export function lookupLetter(id: string): Letter | undefined {
	return LETTERS_BY_LEGACY_ID.get(id);
}

/** הניקוד לפי מזהה הפריט בציר `vowels` (VowelCode) */
export function lookupVowel(code: string): Vowel | undefined {
	return hasOwn(VOWELS_BY_CODE, code) ? VOWELS_BY_CODE[code] : undefined;
}

/**
 * חוק התקפות של צירוף (axisId → itemId). מזהה לא מוכר → לא תקף;
 * אחרת — `isValidLetterVowel` (סופית + שווא/עיצור פסולה).
 */
export function isValidHebrewCombination(combination: Readonly<Record<string, string>>): boolean {
	const letter = lookupLetter(combination[LETTERS_AXIS_ID] ?? '');
	const vowel = lookupVowel(combination[VOWELS_AXIS_ID] ?? '');
	if (!letter || !vowel) return false;
	return isValidLetterVowel(letter, vowel);
}

/** בניית פריט deck מצירוף */
export function pairToContentItem(pair: LetterVowelPair): ContentItem<LetterVowelPair> {
	return { id: pair.id, value: pair, label: pair.display };
}

const LETTER_ITEMS: readonly ContentItem<Letter>[] = LETTERS_ALPHABETICAL.map((letter) => ({
	id: letter.legacyCardId,
	value: letter,
	label: letter.displayChar
}));

const VOWEL_ITEMS: readonly ContentItem<Vowel>[] = ALL_VOWELS.map((vowel) => ({
	id: vowel.code,
	value: vowel,
	label: vowel.displayName
}));

/** מזהי כל האותיות לפי סדר א-ב — ברירת המחדל לבחירת אותיות */
export const DEFAULT_LETTER_IDS: readonly string[] = LETTER_ITEMS.map((item) => item.id);

/**
 * יוצר את ה-Provider. משחקים רגילים צורכים את `hebrewLettersProvider`;
 * ה-factory קיים כדי לאפשר שמות אחרים לצירים/Provider בלי לשכפל תוכן.
 */
export function createHebrewLettersProvider(
	options: HebrewLettersProviderOptions = {}
): HebrewLettersProvider {
	const labels: HebrewLettersLabels = {
		providerName: hebrewLettersLanguage.providerName,
		lettersAxis: hebrewLettersLanguage.axes.letters,
		vowelsAxis: hebrewLettersLanguage.axes.vowels,
		...options.labels
	};

	const lettersAxis: SelectionAxis<Letter> = {
		id: LETTERS_AXIS_ID,
		displayName: labels.lettersAxis,
		minSelected: MIN_SELECTED_LETTERS,
		getAvailableItems: () => [...LETTER_ITEMS]
	};

	const vowelsAxis: SelectionAxis<Vowel> = {
		id: VOWELS_AXIS_ID,
		displayName: labels.vowelsAxis,
		minSelected: MIN_SELECTED_VOWELS,
		getAvailableItems: () => [...VOWEL_ITEMS]
	};

	const axes = [lettersAxis, vowelsAxis] as const;

	return {
		id: HEBREW_LETTERS_PROVIDER_ID,
		displayName: labels.providerName,
		icon: options.icon ?? '🔤',
		selectionAxes: axes,

		generateDeck(selection) {
			return generateCartesianDeck<LetterVowelPair>({
				axes,
				selection,
				isValidCombination: isValidHebrewCombination,
				toItem: (combination) =>
					pairToContentItem(
						makePair(
							combination[LETTERS_AXIS_ID].value as Letter,
							combination[VOWELS_AXIS_ID].value as Vowel
						)
					)
			});
		},

		isValidCombination: isValidHebrewCombination,

		generateCardContent(item): CardContent {
			return { providerId: HEBREW_LETTERS_PROVIDER_ID, itemId: item.id, data: item.value };
		},

		contentMatches(a, b) {
			return (
				a.providerId === HEBREW_LETTERS_PROVIDER_ID &&
				b.providerId === HEBREW_LETTERS_PROVIDER_ID &&
				a.itemId === b.itemId
			);
		},

		getSpeakText(item) {
			return item.value.speak;
		},

		/**
		 * דמיון לפי מזהה הצירוף — זהה ל-`areSimilar(pairA.id, pairB.id)` של
		 * find-letter לפני ה-Provider (הטבלה מכילה מזהי פתח בלבד).
		 */
		areItemsSimilar(a, b) {
			return areSimilar(a.value.id, b.value.id);
		},

		getDefaultSelection() {
			return {
				[LETTERS_AXIS_ID]: [...DEFAULT_LETTER_IDS],
				[VOWELS_AXIS_ID]: [...DEFAULT_VOWEL_CODES]
			};
		},

		getDefaultSettings(): HebrewLettersSettings {
			return {};
		},

		renderComponent: LetterPairContent
	};
}

/** ה-Provider המשותף — אותו אובייקט נרשם ב-registry של כל משחק שצורך אותו */
export const hebrewLettersProvider: HebrewLettersProvider = createHebrewLettersProvider();

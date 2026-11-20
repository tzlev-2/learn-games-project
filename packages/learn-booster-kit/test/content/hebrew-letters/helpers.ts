/**
 * עזרים לבדיקות "אותיות וניקוד" — שומרים על הבדיקות שהועברו מ-find-letter
 * (data/letters.test, data/vowels.test, utils/pair.test, utils/letters.test)
 * כמעט ללא שינוי, מעל ה-API של ה-Provider המשותף.
 */
import {
	ALL_LETTERS_DATA,
	VOWELS_BY_CODE,
	LETTERS_ALPHABETICAL,
	DEFAULT_LETTER_IDS,
	hebrewLettersProvider,
	makePair,
	type LetterVowelPair
} from '../../../src/content/providers/hebrew-letters';

export { DEFAULT_LETTER_IDS };

/** ALL_LETTERS הישן של find-letter: כל אות עם פתח, בסדר הקבוצות base/confusing/rafe */
export const ALL_LETTERS: LetterVowelPair[] = ALL_LETTERS_DATA.map((l) =>
	makePair(l, VOWELS_BY_CODE.patah)
);

/** ALL_LETTERS_ALPHABETICAL הישן — אותו דבר לפי סדר א-ב */
export const ALL_LETTERS_ALPHABETICAL: LetterVowelPair[] = LETTERS_ALPHABETICAL.map((l) =>
	makePair(l, VOWELS_BY_CODE.patah)
);

/** generateDeck(letterIds, vowelCodes) הישן — דרך ה-Provider */
export function generateDeck(letterIds: readonly string[], vowelCodes: readonly string[]): LetterVowelPair[] {
	return hebrewLettersProvider
		.generateDeck({ letters: [...letterIds], vowels: [...vowelCodes] }, {})
		.map((item) => item.value);
}

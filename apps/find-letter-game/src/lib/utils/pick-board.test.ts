/**
 * בחירת לוח (pickBoard) מעל ה-deck של ה-Provider המשותף "אותיות וניקוד",
 * ומסלול הנתונים בחירה → deck → לוח → כרטיסי לוח.
 *
 * הבדיקות של המאגר עצמו (אותיות, ניקוד, צירופים, דמיון, מיפוי TTS) עברו
 * לקיט יחד עם התוכן: packages/learn-booster-kit/test/content/hebrew-letters/.
 * כאן נשארו בדיקות pickBoard מ-utils/letters.test.ts ומ-utils/pickBoard.test.ts.
 */
import { describe, test, it, expect, vi } from 'vitest';
import {
	hebrewLettersProvider as provider,
	PHONETIC_SIMILARITY_PAIRS,
	DEFAULT_LETTER_IDS,
	getTtsFilename,
	type LetterVowelPair
} from 'learn-booster-kit/content/hebrew-letters';
import type { ContentItem } from 'learn-booster-kit';
import { pickBoard } from './pick-board';
import { toBoardCard } from '../content/board-card';

function deckOf(letters: readonly string[], vowels: readonly string[]): ContentItem<LetterVowelPair>[] {
	return provider.generateDeck({ letters: [...letters], vowels: [...vowels] }, {});
}

const isSimilar = (a: ContentItem<LetterVowelPair>, b: ContentItem<LetterVowelPair>) =>
	provider.areItemsSimilar!(a, b);

function board(items: ContentItem<LetterVowelPair>[], count: number, avoidSimilar: boolean) {
	return pickBoard({ count, items, avoidSimilar, isSimilar });
}

// בדיקה 8: לוח 3x4 עם avoidSimilar=true לא מכיל צמד צלילי-דומה
test('לוח 3x4 עם avoidSimilar=true אינו מכיל צמד צלילי-דומה (100 ריצות)', () => {
	const allPairs = deckOf(DEFAULT_LETTER_IDS, ['patah']);
	for (let i = 0; i < 100; i++) {
		const boardIds = board(allPairs, 12, true).map((c) => c.id);
		for (const pair of PHONETIC_SIMILARITY_PAIRS) {
			expect(boardIds.includes(pair.a) && boardIds.includes(pair.b)).toBe(false);
		}
	}
});

// בדיקה 9: אין fallback ללוח 3x4 עם כל 26 האותיות
test('אין fallback ללוח 3x4 עם כל 26 האותיות (100 ריצות)', () => {
	const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const allPairs = deckOf(DEFAULT_LETTER_IDS, ['patah']);
	for (let i = 0; i < 100; i++) board(allPairs, 12, true);
	expect(warnSpy).not.toHaveBeenCalled();
	warnSpy.mockRestore();
});

// בדיקה 12: pickBoard מחזיר רק האותיות הנבחרות
test('pickBoard מחזיר רק האותיות הנבחרות', () => {
	const ids = board(deckOf(['a', 'ba', 'ga'], ['patah']), 3, false).map((c) => c.id).sort();
	expect(ids).toEqual(['a', 'ba', 'ga']);
});

// בדיקה 13: pickBoard מחזיר הכל כש-count גדול מה-pool
test('pickBoard מחזיר הכל כש-count גדול מה-pool', () => {
	expect(board(deckOf(['a', 'ba'], ['patah']), 10, false)).toHaveLength(2);
});

// בדיקה 14: pickBoard עם pool ריק מחזיר []
test('pickBoard עם pool ריק מחזיר []', () => {
	expect(pickBoard({ count: 5, items: [], avoidSimilar: false })).toEqual([]);
});

test('pickBoard בלי isSimilar — אין אילוץ דמיון (sa ו-sa_sin יכולים להופיע יחד)', () => {
	const items = deckOf(['sa', 'sa_sin'], ['patah']);
	const ids = pickBoard({ count: 2, items, avoidSimilar: true }).map((c) => c.id).sort();
	expect(ids).toEqual(['sa', 'sa_sin']);
});

test('avoidSimilar כשאי אפשר לעמוד באילוץ — משלים מהמאגר עם אזהרה', () => {
	const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const ids = board(deckOf(['sa', 'sa_sin'], ['patah']), 2, true).map((c) => c.id).sort();
	expect(ids).toEqual(['sa', 'sa_sin']);
	expect(warnSpy).toHaveBeenCalledOnce();
	warnSpy.mockRestore();
});

describe('pickBoard + deck של ה-Provider', () => {
	it('deck(כל האותיות, פתח) + pickBoard מחזיר 12 כרטיסים', () => {
		expect(board(deckOf(DEFAULT_LETTER_IDS, ['patah']), 12, false)).toHaveLength(12);
	});

	it('עם avoidSimilar=true אין sa ו-sa_sin יחד (50 ריצות)', () => {
		const deck = deckOf(DEFAULT_LETTER_IDS, ['patah']);
		for (let i = 0; i < 50; i++) {
			const ids = board(deck, 12, true).map((p) => p.id);
			expect(ids.includes('sa') && ids.includes('sa_sin'), 'sa ו-sa_sin לא אמורים להיות ביחד').toBe(false);
		}
	});

	it('deck עם ["patah", "none"] מייצר מכפלה קרטזית', () => {
		const ids = deckOf(['ba', 'ga'], ['patah', 'none']).map((p) => p.id).sort();
		expect(ids).toEqual(['b__none', 'ba', 'g__none', 'ga']);
	});
});

describe('data flow: בחירה → deck → pickBoard → כרטיסי לוח', () => {
	it('כרטיסי הלוח: id/display/speak מה-Provider, וה-speak ממופה ל-TTS_FILES', () => {
		const items = board(deckOf(DEFAULT_LETTER_IDS, ['patah']), 12, false);
		for (const item of items) {
			const card = toBoardCard(provider, item);
			expect(card).toEqual({ id: item.value.id, display: item.value.display, speak: item.value.speak });
			expect(getTtsFilename(card.speak), `card.speak="${card.speak}" לא ממופה ב-TTS_FILES`).not.toBeNull();
		}
	});

	it('toBoardCard בלי getSpeakText — ההקראה היא ה-label', () => {
		const { getSpeakText: _omit, ...withoutSpeak } = provider;
		const [item] = deckOf(['ba'], ['patah']);
		expect(toBoardCard(withoutSpeak, item)).toEqual({ id: 'ba', display: 'בַּ', speak: 'בַּ' });
	});
});

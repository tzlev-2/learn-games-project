/**
 * בדיקות ל-generateCards מול ContentProvider של הקיט
 */
import { describe, it, expect, vi } from 'vitest';
import { generateCards, contentMatches } from './gameLogic';
import { hebrewLettersProvider, lettersProvider, shapesProvider } from '$lib/content/providers';

describe('generateCards', () => {
	it('creates pairCount pairs from the provider deck', () => {
		const cards = generateCards({
			pairCount: 3,
			provider: lettersProvider,
			selection: { letters: ['א', 'ב', 'ג', 'ד'] },
			settings: {}
		});
		expect(cards).toHaveLength(6);
		const ids = cards.map((c) => c.content.itemId);
		// כל פריט מופיע בדיוק פעמיים, ורק מתוך הבחירה
		new Set(ids).forEach((id) => {
			expect(['א', 'ב', 'ג', 'ד']).toContain(id);
			expect(ids.filter((x) => x === id)).toHaveLength(2);
		});
		expect(new Set(ids).size).toBe(3);
	});

	it('repeats items when the selection is smaller than pairCount', () => {
		const cards = generateCards({
			pairCount: 4,
			provider: lettersProvider,
			selection: { letters: ['א'] },
			settings: {}
		});
		expect(cards).toHaveLength(8);
		expect(cards.every((c) => c.content.itemId === 'א')).toBe(true);
	});

	it('returns no cards for an empty selection', () => {
		expect(
			generateCards({ pairCount: 5, provider: lettersProvider, selection: { letters: [] }, settings: {} })
		).toEqual([]);
		expect(generateCards({ pairCount: 5, provider: lettersProvider, selection: {}, settings: {} })).toEqual([]);
	});

	it('calls prepareForGame and passes provider settings to generateCardContent', () => {
		const prepare = vi.spyOn(shapesProvider, 'prepareForGame');
		const cards = generateCards({
			pairCount: 2,
			provider: shapesProvider,
			selection: { shapes: ['circle', 'square'] },
			settings: { colorMode: 'uniform' }
		});
		expect(prepare).toHaveBeenCalledOnce();
		expect(cards.every((c) => (c.content.data as { color: string }).color === '#3B82F6')).toBe(true);
		prepare.mockRestore();
	});

	it('the two cards of a pair match via the provider', () => {
		const cards = generateCards({
			pairCount: 1,
			provider: shapesProvider,
			selection: { shapes: ['star'] },
			settings: { colorMode: 'random' }
		});
		expect(contentMatches(cards[0], cards[1], shapesProvider)).toBe(true);
	});
});

describe('generateCards — shared hebrew-letters provider (letters × vowels)', () => {
	it('builds pairs from the cartesian deck; both cards of a pair match', () => {
		const cards = generateCards({
			pairCount: 4,
			provider: hebrewLettersProvider,
			selection: { letters: ['ba', 'ga'], vowels: ['patah', 'hirik'] },
			settings: {}
		});
		expect(cards).toHaveLength(8);
		const ids = cards.map((c) => c.content.itemId);
		expect(new Set(ids)).toEqual(new Set(['ba', 'b__hirik', 'ga', 'g__hirik']));
		for (const card of cards) {
			const twin = cards.find((c) => c !== card && c.content.itemId === card.content.itemId)!;
			expect(contentMatches(card, twin, hebrewLettersProvider)).toBe(true);
			expect(card.content.providerId).toBe('hebrew-letters');
		}
		const [a, b] = cards.filter((c) => c.content.itemId === 'ba');
		const other = cards.find((c) => c.content.itemId === 'b__hirik')!;
		expect(contentMatches(a, b, hebrewLettersProvider)).toBe(true);
		expect(contentMatches(a, other, hebrewLettersProvider)).toBe(false);
	});

	it('an empty axis gives no cards', () => {
		expect(
			generateCards({
				pairCount: 3,
				provider: hebrewLettersProvider,
				selection: { letters: ['ba', 'ga'], vowels: [] },
				settings: {}
			})
		).toEqual([]);
	});
});


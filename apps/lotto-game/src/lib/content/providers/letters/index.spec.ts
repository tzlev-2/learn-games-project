/**
 * בדיקות עבור Letters Content Provider
 */
import { describe, it, expect } from 'vitest';
import { isContentProvider, validateSelection, type ContentItem } from 'learn-booster-kit';
import { lettersProvider, lettersAxis } from './index';
import type { LettersProviderSettings } from './index';

/** עטיפת אות כ-ContentItem (כמו שה-deck מחזיר) */
const asItem = (letter: string): ContentItem<string> => ({ id: letter, value: letter, label: letter });

describe('Letters Provider', () => {
	describe('Provider Metadata', () => {
		it('should have correct id', () => {
			expect(lettersProvider.id).toBe('letters');
		});

		it('should have Hebrew display name', () => {
			expect(lettersProvider.displayName).toBe('אותיות');
		});

		it('should have icon', () => {
			expect(lettersProvider.icon).toBe('🔤');
		});

		it('should have render component', () => {
			expect(lettersProvider.renderComponent).toBeDefined();
		});

		it('should have no extra settings component (selection is rendered by AxisSelector)', () => {
			expect(lettersProvider.settingsComponent).toBeUndefined();
		});

		it('should be a valid kit ContentProvider', () => {
			expect(isContentProvider(lettersProvider)).toBe(true);
		});

		it('should expose a single "letters" selection axis', () => {
			expect(lettersProvider.selectionAxes).toHaveLength(1);
			expect(lettersProvider.selectionAxes[0]).toBe(lettersAxis);
			expect(lettersAxis.id).toBe('letters');
			expect(lettersAxis.displayName).toBeTruthy();
		});
	});

	describe('getAvailableItems (letters axis)', () => {
		it('should return all Hebrew letters', () => {
			const items = lettersAxis.getAvailableItems();
			expect(items).toHaveLength(22); // אבגדהוזחטיכלמנסעפצקרשת
		});

		it('should return items with correct structure', () => {
			const items = lettersAxis.getAvailableItems();
			const firstItem = items[0];

			expect(firstItem).toHaveProperty('id');
			expect(firstItem).toHaveProperty('value');
			expect(firstItem).toHaveProperty('label');
			expect(typeof firstItem.id).toBe('string');
			expect(typeof firstItem.value).toBe('string');
			expect(typeof firstItem.label).toBe('string');
		});

		it('should have matching id, value, and label for each letter', () => {
			const items = lettersAxis.getAvailableItems();
			items.forEach(item => {
				expect(item.id).toBe(item.value);
				expect(item.label).toBe(item.value);
			});
		});

		it('should include aleph', () => {
			const items = lettersAxis.getAvailableItems();
			const aleph = items.find(item => item.value === 'א');
			expect(aleph).toBeDefined();
		});

		it('should include tav', () => {
			const items = lettersAxis.getAvailableItems();
			const tav = items.find(item => item.value === 'ת');
			expect(tav).toBeDefined();
		});
	});

	describe('getDefaultSelection / getDefaultSettings', () => {
		it('should select all letters by default', () => {
			const selection = lettersProvider.getDefaultSelection();
			expect(selection.letters).toHaveLength(22);
		});

		it('should have letters axis in default selection', () => {
			const selection = lettersProvider.getDefaultSelection();
			expect(selection).toHaveProperty('letters');
			expect(Array.isArray(selection.letters)).toBe(true);
			expect(validateSelection(lettersProvider.selectionAxes, selection).isOk()).toBe(true);
		});

		it('should have empty default settings (no selection inside settings)', () => {
			expect(lettersProvider.getDefaultSettings!()).toEqual({});
		});
	});

	describe('generateCardContent', () => {
		it('should generate correct card content', () => {
			const letter = 'א';
			const settings: LettersProviderSettings = {};
			
			const content = lettersProvider.generateCardContent(asItem(letter), settings);

			expect(content.providerId).toBe('letters');
			expect(content.itemId).toBe('א');
			expect(content.data).toBe('א');
		});

		it('should work for different letters', () => {
			const settings: LettersProviderSettings = {};
			
			const contentA = lettersProvider.generateCardContent(asItem('א'), settings);
			const contentB = lettersProvider.generateCardContent(asItem('ב'), settings);

			expect(contentA.itemId).toBe('א');
			expect(contentB.itemId).toBe('ב');
			expect(contentA.itemId).not.toBe(contentB.itemId);
		});
	});

	describe('contentMatches', () => {
		const settings: LettersProviderSettings = {};

		it('should match cards with same letter', () => {
			const card1 = lettersProvider.generateCardContent(asItem('א'), settings);
			const card2 = lettersProvider.generateCardContent(asItem('א'), settings);

			expect(lettersProvider.contentMatches(card1, card2)).toBe(true);
		});

		it('should not match cards with different letters', () => {
			const card1 = lettersProvider.generateCardContent(asItem('א'), settings);
			const card2 = lettersProvider.generateCardContent(asItem('ב'), settings);

			expect(lettersProvider.contentMatches(card1, card2)).toBe(false);
		});
	});

	describe('generateDeck', () => {
		const settings: LettersProviderSettings = {};

		it('should return selected letters (in alphabet order)', () => {
			const deck = lettersProvider.generateDeck({ letters: ['ג', 'א', 'ב'] }, settings);

			expect(deck.map((item) => item.id)).toEqual(['א', 'ב', 'ג']);
			expect(deck[0]).toEqual(asItem('א'));
		});

		it('should return empty array for empty selection', () => {
			expect(lettersProvider.generateDeck({ letters: [] }, settings)).toEqual([]);
			expect(lettersProvider.generateDeck({}, settings)).toEqual([]);
		});

		it('should ignore unknown ids (e.g. final letters, latin)', () => {
			const deck = lettersProvider.generateDeck({ letters: ['א', 'ך', 'x'] }, settings);
			expect(deck.map((item) => item.id)).toEqual(['א']);
		});

		it('should not mutate selection', () => {
			const selection = { letters: ['ב', 'א'] };
			const original = structuredClone(selection);

			const deck = lettersProvider.generateDeck(selection, settings);
			deck.pop();

			expect(selection).toEqual(original);
		});

		it('should return new array each call (immutability)', () => {
			const selection = { letters: ['א'] };
			expect(lettersProvider.generateDeck(selection, settings)).not.toBe(
				lettersProvider.generateDeck(selection, settings)
			);
		});
	});

	describe('Integration: full workflow', () => {
		it('should handle complete provider workflow', () => {
			// 1. קבלת ברירת מחדל
			const defaultSelection = lettersProvider.getDefaultSelection();
			expect(defaultSelection.letters).toHaveLength(22);
			const settings = lettersProvider.getDefaultSettings!();

			// 2. עדכון בחירה
			const selection = { ...defaultSelection, letters: ['א', 'ב', 'ג'] };

			// 3. ייצור deck
			const deck = lettersProvider.generateDeck(selection, settings);
			expect(deck.map((item) => item.id)).toEqual(['א', 'ב', 'ג']);

			// 4. יצירת תוכן כרטיס
			const content = lettersProvider.generateCardContent(deck[0], settings);
			expect(content.providerId).toBe('letters');
			expect(content.itemId).toBe('א');

			// 5. בדיקת התאמה
			const content2 = lettersProvider.generateCardContent(deck[0], settings);
			expect(lettersProvider.contentMatches(content, content2)).toBe(true);
		});
	});
});

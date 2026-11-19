/**
 * בדיקות עבור Reading Content Provider (ציור של קריאה)
 */
import { describe, it, expect } from 'vitest';
import { isContentProvider, validateSelection, type ContentItem } from 'learn-booster-kit';
import { readingProvider, readingAxis, READING_ITEMS } from './index';
import type { ReadingProviderSettings, ReadingItem } from './index';

/** עטיפת פריט קריאה כ-ContentItem (כמו שה-deck מחזיר) */
const asItem = (item: ReadingItem): ContentItem<ReadingItem> => ({
	id: item.id,
	value: item,
	label: `${item.letter} - ${item.helper}`
});

describe('Reading Provider', () => {
	describe('Provider Metadata', () => {
		it('should have correct id', () => {
			expect(readingProvider.id).toBe('reading');
		});

		it('should have Hebrew display name', () => {
			expect(readingProvider.displayName).toBe('ציור של קריאה');
		});

		it('should have icon', () => {
			expect(readingProvider.icon).toBe('📖');
		});

		it('should have render component', () => {
			expect(readingProvider.renderComponent).toBeDefined();
		});

		it('should have no extra settings component (selection is rendered by the axis)', () => {
			expect(readingProvider.settingsComponent).toBeUndefined();
		});

		it('should be a valid kit ContentProvider', () => {
			expect(isContentProvider(readingProvider)).toBe(true);
		});

		it('should expose a single "readingItems" selection axis with item component', () => {
			expect(readingProvider.selectionAxes).toHaveLength(1);
			expect(readingProvider.selectionAxes[0]).toBe(readingAxis);
			expect(readingAxis.id).toBe('readingItems');
			expect(readingAxis.displayName).toBeTruthy();
			expect(readingAxis.itemComponent).toBeDefined();
		});

		it('should have cardStyles configured', () => {
			expect(readingProvider.cardStyles).toBeDefined();
			expect(readingProvider.cardStyles?.contentLayout).toBe('vertical');
			expect(readingProvider.cardStyles?.padding).toBe('0.5rem');
		});
	});

	describe('getAvailableItems (readingItems axis)', () => {
		it('should return all reading items (א-ח)', () => {
			const items = readingAxis.getAvailableItems();
			expect(items).toHaveLength(8); // aleph, bet, gimel, dalet, he, vav, zayin, het
		});

		it('should return items with correct structure', () => {
			const items = readingAxis.getAvailableItems();
			const firstItem = items[0];

			expect(firstItem).toHaveProperty('id');
			expect(firstItem).toHaveProperty('value');
			expect(firstItem).toHaveProperty('label');
			expect(typeof firstItem.id).toBe('string');
			expect(typeof firstItem.value).toBe('object');
			expect(typeof firstItem.label).toBe('string');
		});

		it('should have label format "letter - helper"', () => {
			const items = readingAxis.getAvailableItems();
			const aleph = items.find(item => item.id === 'aleph');
			
			expect(aleph).toBeDefined();
			expect(aleph?.label).toContain(' - ');
			expect(aleph?.label).toContain('אַ');
			expect(aleph?.label).toContain('אגס');
		});

		it('should include aleph', () => {
			const items = readingAxis.getAvailableItems();
			const aleph = items.find(item => item.value.id === 'aleph');
			
			expect(aleph).toBeDefined();
			expect(aleph?.value.letter).toBe('אַ');
			expect(aleph?.value.helper).toBe('אגס');
		});

		it('should include het', () => {
			const items = readingAxis.getAvailableItems();
			const het = items.find(item => item.value.id === 'het');
			
			expect(het).toBeDefined();
			expect(het?.value.letter).toBe('חָ');
			expect(het?.value.helper).toBe('חלון');
		});

		it('should include all items from READING_ITEMS constant', () => {
			const items = readingAxis.getAvailableItems();
			READING_ITEMS.forEach(readingItem => {
				const found = items.find(item => item.value.id === readingItem.id);
				expect(found).toBeDefined();
			});
		});
	});

	describe('getDefaultSelection / getDefaultSettings', () => {
		it('should select all items by default', () => {
			const selection = readingProvider.getDefaultSelection();
			expect(selection.readingItems).toHaveLength(8);
		});

		it('should have readingItems axis in default selection', () => {
			const selection = readingProvider.getDefaultSelection();
			expect(selection).toHaveProperty('readingItems');
			expect(Array.isArray(selection.readingItems)).toBe(true);
			expect(validateSelection(readingProvider.selectionAxes, selection).isOk()).toBe(true);
		});

		it('should include all item IDs', () => {
			const selection = readingProvider.getDefaultSelection();
			const expectedIds = READING_ITEMS.map(item => item.id);

			expect(selection.readingItems).toEqual(expectedIds);
		});

		it('should have empty default settings (no selection inside settings)', () => {
			expect(readingProvider.getDefaultSettings!()).toEqual({});
		});
	});

	describe('generateCardContent', () => {
		it('should generate correct card content', () => {
			const item: ReadingItem = {
				id: 'aleph',
				letter: 'אַ',
				imagePath: '/reading-icons/aleph_pear.png',
				helper: 'אגס'
			};
			const settings: ReadingProviderSettings = {};
			
			const content = readingProvider.generateCardContent(asItem(item), settings);

			expect(content.providerId).toBe('reading');
			expect(content.itemId).toBe('aleph');
			expect(content.data).toHaveProperty('letter');
			expect(content.data).toHaveProperty('imagePath');
			expect(content.data).toHaveProperty('helper');
			
			const data = content.data as any;
			expect(data.letter).toBe('אַ');
			expect(data.imagePath).toBe('/reading-icons/aleph_pear.png');
			expect(data.helper).toBe('אגס');
		});

		it('should work for different items', () => {
			const settings: ReadingProviderSettings = {};
			
			const contentAleph = readingProvider.generateCardContent(asItem(READING_ITEMS[0]),
				settings
			);
			const contentBet = readingProvider.generateCardContent(asItem(READING_ITEMS[1]),
				settings
			);

			expect(contentAleph.itemId).toBe('aleph');
			expect(contentBet.itemId).toBe('bet');
			expect(contentAleph.itemId).not.toBe(contentBet.itemId);
		});

		it('should preserve all item properties in data', () => {
			const item: ReadingItem = {
				id: 'gimel',
				letter: 'גָ',
				imagePath: '/reading-icons/gimel_wheel.png',
				helper: 'גלגל'
			};
			const settings: ReadingProviderSettings = {};
			
			const content = readingProvider.generateCardContent(asItem(item), settings);
			const data = content.data as any;

			expect(data.letter).toBe(item.letter);
			expect(data.imagePath).toBe(item.imagePath);
			expect(data.helper).toBe(item.helper);
		});
	});

	describe('contentMatches', () => {
		const settings: ReadingProviderSettings = {};

		it('should match cards with same item', () => {
			const card1 = readingProvider.generateCardContent(asItem(READING_ITEMS[0]), settings);
			const card2 = readingProvider.generateCardContent(asItem(READING_ITEMS[0]), settings);

			expect(readingProvider.contentMatches(card1, card2)).toBe(true);
		});

		it('should not match cards with different items', () => {
			const card1 = readingProvider.generateCardContent(asItem(READING_ITEMS[0]), settings);
			const card2 = readingProvider.generateCardContent(asItem(READING_ITEMS[1]), settings);

			expect(readingProvider.contentMatches(card1, card2)).toBe(false);
		});

		it('should match based on itemId (aleph)', () => {
			const card1 = {
				providerId: 'reading',
				itemId: 'aleph',
				data: { letter: 'אַ', imagePath: '/path1', helper: 'אגס' }
			};
			const card2 = {
				providerId: 'reading',
				itemId: 'aleph',
				data: { letter: 'אַ', imagePath: '/path2', helper: 'אגס' }
			};

			expect(readingProvider.contentMatches(card1, card2)).toBe(true);
		});
	});

	describe('generateDeck', () => {
		const settings: ReadingProviderSettings = {};

		it('should return selected items (in READING_ITEMS order)', () => {
			const deck = readingProvider.generateDeck({ readingItems: ['gimel', 'aleph', 'bet'] }, settings);

			expect(deck.map((item) => item.id)).toEqual(['aleph', 'bet', 'gimel']);
			expect(deck[0]).toEqual(asItem(READING_ITEMS[0]));
		});

		it('should return empty array for empty selection', () => {
			expect(readingProvider.generateDeck({ readingItems: [] }, settings)).toEqual([]);
			expect(readingProvider.generateDeck({}, settings)).toEqual([]);
		});

		it('should ignore unknown item ids', () => {
			const deck = readingProvider.generateDeck({ readingItems: ['aleph', 'tet'] }, settings);
			expect(deck.map((item) => item.id)).toEqual(['aleph']);
		});

		it('should not mutate selection', () => {
			const selection = { readingItems: ['bet', 'aleph'] };
			const original = structuredClone(selection);

			const deck = readingProvider.generateDeck(selection, settings);
			deck.pop();

			expect(selection).toEqual(original);
		});

		it('should return new array each call (immutability)', () => {
			const selection = { readingItems: ['aleph'] };
			expect(readingProvider.generateDeck(selection, settings)).not.toBe(
				readingProvider.generateDeck(selection, settings)
			);
		});
	});

	describe('Integration: full workflow', () => {
		it('should handle complete provider workflow', () => {
			// 1. קבלת ברירת מחדל
			const defaultSelection = readingProvider.getDefaultSelection();
			expect(defaultSelection.readingItems).toHaveLength(8);
			const settings = readingProvider.getDefaultSettings!();

			// 2. עדכון בחירה
			const selection = { ...defaultSelection, readingItems: ['aleph', 'bet', 'gimel'] };

			// 3. ייצור deck
			const deck = readingProvider.generateDeck(selection, settings);
			expect(deck.map((item) => item.id)).toEqual(['aleph', 'bet', 'gimel']);

			// 4. יצירת תוכן כרטיס
			const content = readingProvider.generateCardContent(deck[0], settings);
			expect(content.providerId).toBe('reading');
			expect(content.itemId).toBe('aleph');

			// 5. בדיקת התאמה
			const content2 = readingProvider.generateCardContent(deck[0], settings);
			expect(readingProvider.contentMatches(content, content2)).toBe(true);
		});
	});

	describe('READING_ITEMS constant', () => {
		it('should have 8 items (א-ח)', () => {
			expect(READING_ITEMS).toHaveLength(8);
		});

		it('should have all required letters in order', () => {
			const itemIds = READING_ITEMS.map(item => item.id);
			expect(itemIds).toEqual([
				'aleph', 'bet', 'gimel', 'dalet', 
				'he', 'vav', 'zayin', 'het'
			]);
		});

		it('should have valid structure for all items', () => {
			READING_ITEMS.forEach(item => {
				expect(item).toHaveProperty('id');
				expect(item).toHaveProperty('letter');
				expect(item).toHaveProperty('imagePath');
				expect(item).toHaveProperty('helper');
				
				expect(typeof item.id).toBe('string');
				expect(typeof item.letter).toBe('string');
				expect(typeof item.imagePath).toBe('string');
				expect(typeof item.helper).toBe('string');
			});
		});

		it('should have image paths pointing to reading-icons directory', () => {
			READING_ITEMS.forEach(item => {
				expect(item.imagePath).toMatch(/^\/reading-icons\//);
				expect(item.imagePath).toMatch(/\.png$/);
			});
		});

		it('should have Hebrew letters with nikud', () => {
			const letters = READING_ITEMS.map(item => item.letter);
			expect(letters).toContain('אַ');
			expect(letters).toContain('בָּ');
			expect(letters).toContain('גָ');
			expect(letters).toContain('דָ');
			expect(letters).toContain('הָ');
			expect(letters).toContain('ו');
			expect(letters).toContain('זָ');
			expect(letters).toContain('חָ');
		});

		it('should have Hebrew helper words', () => {
			const helpers = READING_ITEMS.map(item => item.helper);
			expect(helpers).toContain('אגס');
			expect(helpers).toContain('בלון');
			expect(helpers).toContain('גלגל');
			expect(helpers).toContain('דג');
			expect(helpers).toContain('הר');
			expect(helpers).toContain('ופל');
			expect(helpers).toContain('זקן');
			expect(helpers).toContain('חלון');
		});
	});
});

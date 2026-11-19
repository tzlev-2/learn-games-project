/**
 * בדיקות עבור Shapes Content Provider (ContentProvider רב-צירי של הקיט, ציר יחיד)
 */
import { describe, it, expect } from 'vitest';
import { isContentProvider, validateSelection, type ContentItem } from 'learn-booster-kit';
import { shapesProvider, shapesAxis, SHAPES } from './index';
import type { ShapesProviderSettings, ShapeDefinition } from './index';

/** עטיפת הגדרת צורה כ-ContentItem (כמו שה-deck מחזיר) */
const asItem = (shape: ShapeDefinition): ContentItem<ShapeDefinition> => ({
	id: shape.id,
	value: shape,
	label: shape.name
});

const circle = asItem({ id: 'circle', name: 'עיגול' });
const square = asItem({ id: 'square', name: 'ריבוע' });

describe('Shapes Provider', () => {
	describe('Provider Metadata', () => {
		it('should have correct id', () => {
			expect(shapesProvider.id).toBe('shapes');
		});

		it('should have Hebrew display name', () => {
			expect(shapesProvider.displayName).toBe('צורות');
		});

		it('should have icon', () => {
			expect(shapesProvider.icon).toBe('🔷');
		});

		it('should have render component', () => {
			expect(shapesProvider.renderComponent).toBeDefined();
		});

		it('should have settings component', () => {
			expect(shapesProvider.settingsComponent).toBeDefined();
		});

		it('should be a valid kit ContentProvider', () => {
			expect(isContentProvider(shapesProvider)).toBe(true);
		});

		it('should expose a single "shapes" selection axis with item component', () => {
			expect(shapesProvider.selectionAxes).toHaveLength(1);
			expect(shapesProvider.selectionAxes[0]).toBe(shapesAxis);
			expect(shapesAxis.id).toBe('shapes');
			expect(shapesAxis.displayName).toBeTruthy();
			expect(shapesAxis.itemComponent).toBeDefined();
		});
	});

	describe('getAvailableItems (shapes axis)', () => {
		it('should return all shape definitions', () => {
			const items = shapesAxis.getAvailableItems();
			expect(items).toHaveLength(10); // circle, square, triangle, star, heart, diamond, hexagon, semicircle, pentagon, cross
		});

		it('should return items with correct structure', () => {
			const items = shapesAxis.getAvailableItems();
			const firstItem = items[0];

			expect(firstItem).toHaveProperty('id');
			expect(firstItem).toHaveProperty('value');
			expect(firstItem).toHaveProperty('label');
			expect(typeof firstItem.id).toBe('string');
			expect(typeof firstItem.value).toBe('object');
			expect(typeof firstItem.label).toBe('string');
		});

		it('should include circle', () => {
			const items = shapesAxis.getAvailableItems();
			const found = items.find((item) => item.value.id === 'circle');
			expect(found).toBeDefined();
			expect(found?.value.name).toBe('עיגול');
		});

		it('should include all shapes from SHAPES constant', () => {
			const items = shapesAxis.getAvailableItems();
			SHAPES.forEach((shape) => {
				const found = items.find((item) => item.value.id === shape.id);
				expect(found).toBeDefined();
			});
		});
	});

	describe('getDefaultSelection / getDefaultSettings', () => {
		it('should select all shapes by default', () => {
			const selection = shapesProvider.getDefaultSelection();
			expect(selection.shapes).toHaveLength(10);
		});

		it('should have shapes axis in default selection', () => {
			const selection = shapesProvider.getDefaultSelection();
			expect(selection).toHaveProperty('shapes');
			expect(Array.isArray(selection.shapes)).toBe(true);
			expect(validateSelection(shapesProvider.selectionAxes, selection).isOk()).toBe(true);
		});

		it('should have colorMode property', () => {
			const settings = shapesProvider.getDefaultSettings!();
			expect(settings).toHaveProperty('colorMode');
			expect(settings.colorMode).toBe('random');
		});

		it('should not keep the selection inside settings', () => {
			expect(shapesProvider.getDefaultSettings!()).not.toHaveProperty('selectedShapes');
		});
	});

	describe('generateCardContent', () => {
		it('should generate correct card content with uniform color', () => {
			const settings: ShapesProviderSettings = { colorMode: 'uniform' };

			const content = shapesProvider.generateCardContent(circle, settings);

			expect(content.providerId).toBe('shapes');
			expect(content.itemId).toBe('circle');
			expect(content.data).toHaveProperty('shapeId');
			expect(content.data).toHaveProperty('color');
			expect((content.data as any).shapeId).toBe('circle');
			expect((content.data as any).color).toBe('#3B82F6'); // DEFAULT_UNIFORM_COLOR
		});

		it('should generate content with random color', () => {
			const settings: ShapesProviderSettings = { colorMode: 'random' };

			const content = shapesProvider.generateCardContent(circle, settings);
			const data = content.data as any;

			expect(data.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
		});

		it('should give unique colors per pair after prepareForGame (random mode)', () => {
			const settings: ShapesProviderSettings = { colorMode: 'random' };
			shapesProvider.prepareForGame?.();
			const colors = Array.from({ length: 20 }, () =>
				(shapesProvider.generateCardContent(circle, settings).data as any).color
			);
			expect(new Set(colors).size).toBe(20);
		});

		it('should work for different shapes', () => {
			const settings: ShapesProviderSettings = { colorMode: 'uniform' };

			const contentCircle = shapesProvider.generateCardContent(circle, settings);
			const contentSquare = shapesProvider.generateCardContent(square, settings);

			expect(contentCircle.itemId).toBe('circle');
			expect(contentSquare.itemId).toBe('square');
			expect(contentCircle.itemId).not.toBe(contentSquare.itemId);
		});
	});

	describe('contentMatches', () => {
		it('should match cards with same shape and color', () => {
			const settings: ShapesProviderSettings = { colorMode: 'uniform' };

			const card1 = shapesProvider.generateCardContent(circle, settings);
			const card2 = shapesProvider.generateCardContent(circle, settings);

			expect(shapesProvider.contentMatches(card1, card2)).toBe(true);
		});

		it('should not match cards with different shapes', () => {
			const settings: ShapesProviderSettings = { colorMode: 'uniform' };

			const card1 = shapesProvider.generateCardContent(circle, settings);
			const card2 = shapesProvider.generateCardContent(square, settings);

			expect(shapesProvider.contentMatches(card1, card2)).toBe(false);
		});

		it('should not match cards with same shape but different colors', () => {
			// יצירת שני כרטיסים עם צבעים שונים באופן ידני
			const card1 = {
				providerId: 'shapes',
				itemId: 'circle',
				data: { shapeId: 'circle', color: '#FF0000' }
			};
			const card2 = {
				providerId: 'shapes',
				itemId: 'circle',
				data: { shapeId: 'circle', color: '#00FF00' }
			};

			expect(shapesProvider.contentMatches(card1, card2)).toBe(false);
		});
	});

	describe('generateDeck', () => {
		const settings: ShapesProviderSettings = { colorMode: 'uniform' };

		it('should return selected shapes (in shapes order)', () => {
			const deck = shapesProvider.generateDeck({ shapes: ['triangle', 'circle', 'square'] }, settings);

			expect(deck.map((item) => item.id)).toEqual(['circle', 'square', 'triangle']);
			expect(deck[0]).toEqual(circle);
		});

		it('should return empty array for empty selection', () => {
			expect(shapesProvider.generateDeck({ shapes: [] }, settings)).toEqual([]);
			expect(shapesProvider.generateDeck({}, settings)).toEqual([]);
		});

		it('should ignore unknown shape ids', () => {
			const deck = shapesProvider.generateDeck({ shapes: ['circle', 'blob'] }, settings);
			expect(deck.map((item) => item.id)).toEqual(['circle']);
		});

		it('should not depend on colorMode', () => {
			const selection = { shapes: ['circle', 'square'] };
			expect(shapesProvider.generateDeck(selection, { colorMode: 'random' })).toEqual(
				shapesProvider.generateDeck(selection, { colorMode: 'uniform' })
			);
		});

		it('should not mutate selection or settings', () => {
			const selection = { shapes: ['square', 'circle'] };
			const localSettings: ShapesProviderSettings = { colorMode: 'random' };
			const originalSelection = structuredClone(selection);
			const originalSettings = { ...localSettings };

			const deck = shapesProvider.generateDeck(selection, localSettings);
			deck.pop();

			expect(selection).toEqual(originalSelection);
			expect(localSettings).toEqual(originalSettings);
		});

		it('should return new array each call (immutability)', () => {
			const selection = { shapes: ['circle'] };
			expect(shapesProvider.generateDeck(selection, settings)).not.toBe(
				shapesProvider.generateDeck(selection, settings)
			);
		});
	});

	describe('Integration: full workflow', () => {
		it('should handle complete provider workflow with uniform color', () => {
			// 1. קבלת ברירת מחדל
			const defaultSelection = shapesProvider.getDefaultSelection();
			expect(defaultSelection.shapes).toHaveLength(10);
			const settings: ShapesProviderSettings = { ...shapesProvider.getDefaultSettings!(), colorMode: 'uniform' };

			// 2. עדכון בחירה
			const selection = { ...defaultSelection, shapes: ['circle', 'square'] };

			// 3. ייצור deck
			const deck = shapesProvider.generateDeck(selection, settings);
			expect(deck.map((item) => item.id)).toEqual(['circle', 'square']);

			// 4. יצירת תוכן כרטיס
			const content = shapesProvider.generateCardContent(deck[0], settings);
			expect(content.providerId).toBe('shapes');
			expect(content.itemId).toBe('circle');

			// 5. בדיקת התאמה (במצב uniform שני כרטיסים של אותה צורה תמיד יתאימו)
			const content2 = shapesProvider.generateCardContent(deck[0], settings);
			expect(shapesProvider.contentMatches(content, content2)).toBe(true);
		});
	});

	describe('SHAPES constant', () => {
		it('should have 10 shapes', () => {
			expect(SHAPES).toHaveLength(10);
		});

		it('should have all required shapes', () => {
			const shapeIds = SHAPES.map((s) => s.id);
			expect(shapeIds).toContain('circle');
			expect(shapeIds).toContain('square');
			expect(shapeIds).toContain('triangle');
			expect(shapeIds).toContain('star');
			expect(shapeIds).toContain('heart');
			expect(shapeIds).toContain('diamond');
			expect(shapeIds).toContain('hexagon');
			expect(shapeIds).toContain('semicircle');
			expect(shapeIds).toContain('pentagon');
			expect(shapeIds).toContain('cross');
		});

		it('should have Hebrew names', () => {
			SHAPES.forEach((shape) => {
				expect(shape.name).toBeTruthy();
				expect(typeof shape.name).toBe('string');
			});
		});
	});
});

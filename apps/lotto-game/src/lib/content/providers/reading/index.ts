/**
 * ספק תוכן "ציור של קריאה" — ציר בחירה יחיד (`readingItems`)
 * שיטת עופרה כלב - תומכי זיכרון חזותיים לאותיות עבריות
 */
import { selectAxisItems } from 'learn-booster-kit';
import type { ContentProvider, ContentItem, CardContent, SelectionAxis } from '../../types';
import { language } from '$lib/language';
import ReadingContent from './ReadingContent.svelte';
import ReadingAxisItem from './ReadingAxisItem.svelte';

/** הגדרת פריט קריאה - אות עם תומך זיכרון */
export interface ReadingItem {
	id: string;
	letter: string; // האות עם ניקוד
	imagePath: string; // נתיב לתמונת התומך
	helper: string; // שם התומך בעברית
}

/** רשימת האותיות עם תומכי הזיכרון (א-ח) */
export const READING_ITEMS: ReadingItem[] = [
	{ id: 'aleph', letter: 'אַ', imagePath: '/reading-icons/aleph_pear.png', helper: 'אגס' },
	{ id: 'bet', letter: 'בָּ', imagePath: '/reading-icons/bet_balloon.png', helper: 'בלון' },
	{ id: 'gimel', letter: 'גָ', imagePath: '/reading-icons/gimel_wheel.png', helper: 'גלגל' },
	{ id: 'dalet', letter: 'דָ', imagePath: '/reading-icons/dalet_fish.png', helper: 'דג' },
	{ id: 'he', letter: 'הָ', imagePath: '/reading-icons/he_mountain.png', helper: 'הר' },
	{ id: 'vav', letter: 'ו', imagePath: '/reading-icons/vav_waffle.png', helper: 'ופל' },
	{ id: 'zayin', letter: 'זָ', imagePath: '/reading-icons/zayin_beard.png', helper: 'זקן' },
	{ id: 'het', letter: 'חָ', imagePath: '/reading-icons/het_window.png', helper: 'חלון' }
];

/** לספק הקריאה אין הגדרות מעבר לבחירה */
export type ReadingProviderSettings = Record<string, never>;

/** תוכן כרטיס קריאה */
interface ReadingContentData {
	letter: string;
	imagePath: string;
	helper: string;
}

/** ציר בחירת פריטי הקריאה */
export const readingAxis: SelectionAxis<ReadingItem> = {
	id: 'readingItems',
	displayName: language.content.axes.readingItems,
	getAvailableItems(): ContentItem<ReadingItem>[] {
		return READING_ITEMS.map((item) => ({
			id: item.id,
			value: item,
			label: `${item.letter} - ${item.helper}`
		}));
	},
	itemComponent: ReadingAxisItem
};

/** ספק "ציור של קריאה" */
export const readingProvider: ContentProvider<ReadingProviderSettings, ReadingItem> = {
	id: 'reading',
	displayName: language.content.providers.reading,
	icon: '📖',

	selectionAxes: [readingAxis],

	generateDeck(selection) {
		return selectAxisItems(readingAxis, selection);
	},

	getDefaultSelection() {
		return { [readingAxis.id]: READING_ITEMS.map((item) => item.id) };
	},

	getDefaultSettings(): ReadingProviderSettings {
		return {};
	},

	generateCardContent(item: ContentItem<ReadingItem>): CardContent {
		const { letter, imagePath, helper } = item.value;
		const data: ReadingContentData = { letter, imagePath, helper };

		return {
			providerId: 'reading',
			itemId: item.id,
			data
		};
	},

	contentMatches(a: CardContent, b: CardContent): boolean {
		// זוגות זהים - אותו itemId
		return a.itemId === b.itemId;
	},

	renderComponent: ReadingContent,

	// עיצוב כרטיס מותאם - אות למעלה, תמונה למטה
	cardStyles: {
		contentLayout: 'vertical',
		padding: '0.5rem'
	}
};

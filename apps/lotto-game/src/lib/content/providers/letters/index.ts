/**
 * ספק תוכן לאותיות עבריות — ציר בחירה יחיד (`letters`)
 */
import { selectAxisItems } from 'learn-booster-kit';
import type { ContentProvider, ContentItem, CardContent, SelectionAxis } from '../../types';
import { language } from '$lib/language';
import LetterContent from './LetterContent.svelte';

/** רשימת האותיות העבריות */
const LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');

/** לספק האותיות אין הגדרות מעבר לבחירה */
export type LettersProviderSettings = Record<string, never>;

/** ציר בחירת האותיות */
export const lettersAxis: SelectionAxis<string> = {
	id: 'letters',
	displayName: language.content.axes.letters,
	getAvailableItems(): ContentItem<string>[] {
		return LETTERS.map((letter) => ({
			id: letter,
			value: letter,
			label: letter
		}));
	}
};

/** ספק האותיות */
export const lettersProvider: ContentProvider<LettersProviderSettings, string> = {
	id: 'letters',
	displayName: language.content.providers.letters,
	icon: '🔤',

	selectionAxes: [lettersAxis],

	generateDeck(selection) {
		return selectAxisItems(lettersAxis, selection);
	},

	getDefaultSelection() {
		return { [lettersAxis.id]: [...LETTERS] };
	},

	getDefaultSettings(): LettersProviderSettings {
		return {};
	},

	generateCardContent(item: ContentItem<string>): CardContent {
		return {
			providerId: 'letters',
			itemId: item.id,
			data: item.value
		};
	},

	contentMatches(a: CardContent, b: CardContent): boolean {
		// השוואה פשוטה של האותיות
		return a.itemId === b.itemId;
	},

	renderComponent: LetterContent
};

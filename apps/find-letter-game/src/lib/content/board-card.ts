/**
 * כרטיס על הלוח — מה שהמשחק צריך מפריט של Provider: מזהה, תצוגה והקראה.
 * functional core (טהור). ה-Board/LetterCard מציגים את הצורה הזו בלבד, כך
 * שהמשחק לא תלוי בטיפוס הפריט של Provider מסוים (providerization-plan §3.2).
 */
import type { AnyContentProvider, ContentItem } from 'learn-booster-kit';

export interface BoardCard {
	/** מזהה הפריט ב-deck (`ContentItem.id`) — יציב, משמש להשוואת תשובה */
	id: string;
	/** מה שמוצג בכרטיס (`ContentItem.label`, למשל "בַּ") */
	display: string;
	/** הטקסט להקראה (`provider.getSpeakText`), או ה-label כשאין */
	speak: string;
}

export function toBoardCard(provider: AnyContentProvider, item: ContentItem): BoardCard {
	return {
		id: item.id,
		display: item.label,
		speak: provider.getSpeakText?.(item) ?? item.label
	};
}

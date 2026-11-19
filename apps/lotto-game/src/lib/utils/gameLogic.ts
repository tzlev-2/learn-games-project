/**
 * לוגיקת משחק הלוטו - גרסה מודולרית
 * תומכת בספקי תוכן (Content Providers) דינמיים
 */
import type { AnyContentProvider, CardContent, ProviderSelection } from '$lib/content/types';

// ===== טיפוסים =====

/** כרטיס במשחק */
export interface Card {
	id: number;
	content: CardContent;
	isSelected: boolean;
	isMatched: boolean;
	isError?: boolean;
	isSuccess?: boolean;
}

// ===== ייצוא מחדש מהספקים =====
// שמירה על תאימות לאחור
export type { ShapeDefinition } from '$lib/content/providers';
export { SHAPES } from '$lib/content/providers';

// ===== פונקציות עזר =====

/**
 * בחירת items רנדומליים או עם חזרות
 */
function selectItems<T>(items: T[], count: number): T[] {
	if (items.length === 0) return [];

	const result: T[] = [];

	if (items.length >= count) {
		// יש מספיק פריטים - בחר subset רנדומלי
		const shuffled = [...items].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	} else {
		// לא מספיק פריטים - צריך לחזור על חלקם
		result.push(...items);
		const remaining = count - items.length;
		for (let i = 0; i < remaining; i++) {
			result.push(items[Math.floor(Math.random() * items.length)]);
		}
		return result;
	}
}

// ===== פונקציות ייצור כרטיסים =====

/** פרמטרים ליצירת כרטיסים */
export interface GenerateCardsParams<TSettings = unknown> {
	pairCount: number;
	provider: AnyContentProvider;
	/** בחירת המורה (axisId → itemIds) */
	selection: ProviderSelection;
	settings: TSettings;
}

/**
 * יצירת כרטיסים למשחק
 * משתמש ב-provider לייצור התוכן
 */
export function generateCards<TSettings = unknown>(
	params: GenerateCardsParams<TSettings>
): Card[] {
	const { pairCount, provider, selection, settings } = params;

	// ה-deck מה-provider: הפריטים שנבחרו (או הצירופים התקינים, ב-provider רב-צירי)
	const selectedItems = provider.generateDeck(selection, settings);

	if (selectedItems.length === 0) return [];

	// בחירת פריטים למשחק
	const gameItems = selectItems(selectedItems, pairCount);
	const cards: Card[] = [];

	// איפוס מצב פנימי של ה-provider (כמו מאגר צבעים)
	provider.prepareForGame?.();

	// יצירת זוגות כרטיסים
	gameItems.forEach((item) => {
		// יצירת תוכן הכרטיס
		const content = provider.generateCardContent(item, settings);

		// כרטיס ראשון בזוג
		cards.push({
			id: Math.random(),
			content,
			isSelected: false,
			isMatched: false
		});

		// כרטיס שני בזוג (תוכן זהה)
		cards.push({
			id: Math.random(),
			content,
			isSelected: false,
			isMatched: false
		});
	});

	// ערבוב הכרטיסים
	return cards.sort(() => Math.random() - 0.5);
}

/**
 * השוואת תוכן שני כרטיסים
 */
export function contentMatches(
	card1: Card,
	card2: Card,
	provider: AnyContentProvider
): boolean {
	return provider.contentMatches(card1.content, card2.content);
}

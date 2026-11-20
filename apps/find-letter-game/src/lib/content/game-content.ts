/**
 * התוכן של "איפה האות?" — registry משלו + הצהרה אילו Providers המשחק צורך.
 *
 * המשחק צורך את ה-Provider המשותף "אותיות וניקוד" מהקיט — אותו אובייקט שהלוטו
 * צורך (platform-plan שלב 4: תוכן אחד, כמה משחקים). המשחק עצמו גנרי: הוא
 * מקבל deck מ-`generateDeck`, הקראה מ-`getSpeakText` ודמיון מ-`areItemsSimilar`.
 * תיעוד: packages/learn-booster-kit/docs/content-provider.md §4, §7.
 */
import {
	createContentRegistry,
	resolveGameContent,
	type GameContentDeclaration
} from 'learn-booster-kit';
import {
	hebrewLettersProvider,
	HEBREW_LETTERS_PROVIDER_ID
} from 'learn-booster-kit/content/hebrew-letters';

export const FIND_LETTER_GAME_ID = 'find-letter-game';

/** instance יחיד של ה-registry במשחק */
export const contentRegistry = createContentRegistry([hebrewLettersProvider]);

export const FIND_LETTER_CONTENT_DECLARATION: GameContentDeclaration = {
	gameId: FIND_LETTER_GAME_ID,
	providerIds: [HEBREW_LETTERS_PROVIDER_ID],
	defaultProviderId: HEBREW_LETTERS_PROVIDER_ID
};

/** התוכן הפתור. הצהרה שגויה היא programmer error — נכשלים מיד בטעינה. */
export const findLetterContent = resolveGameContent(
	contentRegistry,
	FIND_LETTER_CONTENT_DECLARATION
).match(
	(content) => content,
	(error) => {
		throw new Error(`[find-letter] ${error.summary}`);
	}
);

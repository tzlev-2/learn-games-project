/**
 * הצהרת התוכן של הלוטו: אילו Providers המשחק צורך, ובאיזה סדר.
 */
import { resolveGameContent, type GameContentDeclaration } from 'learn-booster-kit';
import { contentRegistry } from './registry';
// ייבוא מבצע רישום של ה-Providers ב-registry
import './providers';

export const LOTTO_CONTENT_DECLARATION: GameContentDeclaration = {
	gameId: 'lotto-game',
	providerIds: ['letters', 'shapes', 'reading'],
	defaultProviderId: 'letters'
};

/**
 * התוכן הפתור של הלוטו. הצהרה שגויה היא programmer error — נכשלים מיד בטעינה.
 */
export const lottoContent = resolveGameContent(contentRegistry, LOTTO_CONTENT_DECLARATION).match(
	(content) => content,
	(error) => {
		throw new Error(`[lotto-game] ${error.summary}`);
	}
);

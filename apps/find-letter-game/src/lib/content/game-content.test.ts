/**
 * הצהרת התוכן של find-letter: Provider משותף אחד ("אותיות וניקוד") מהקיט.
 */
import { describe, it, expect } from 'vitest';
import { hebrewLettersProvider } from 'learn-booster-kit/content/hebrew-letters';
import { findLetterContent, contentRegistry, FIND_LETTER_CONTENT_DECLARATION } from './game-content';

describe('findLetterContent', () => {
	it('מצהיר על hebrew-letters כ-Provider יחיד וברירת מחדל', () => {
		expect(FIND_LETTER_CONTENT_DECLARATION).toEqual({
			gameId: 'find-letter-game',
			providerIds: ['hebrew-letters'],
			defaultProviderId: 'hebrew-letters'
		});
		expect(findLetterContent.providers.map((p) => p.id)).toEqual(['hebrew-letters']);
	});

	it('ה-Provider הוא האובייקט המשותף מהקיט (תוכן אחד, כמה משחקים)', () => {
		expect(findLetterContent.defaultProvider).toBe(hebrewLettersProvider);
		expect(contentRegistry.getOrThrow('hebrew-letters')).toBe(hebrewLettersProvider);
	});

	it('id שמור לא מוכר → ברירת המחדל', () => {
		expect(findLetterContent.resolveProviderId('ghost')).toBe('hebrew-letters');
		expect(findLetterContent.getProvider(undefined)).toBe(hebrewLettersProvider);
	});
});

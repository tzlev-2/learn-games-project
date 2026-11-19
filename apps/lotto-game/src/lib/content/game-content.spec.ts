/**
 * בדיקות להצהרת התוכן של הלוטו ול-registry שלה.
 * (בדיקות ה-registry הגנרי וה-type guards עברו לקיט: packages/learn-booster-kit/test/content/)
 */
import { describe, it, expect } from 'vitest';
import { isContentProvider } from 'learn-booster-kit';
import { contentRegistry } from './registry';
import { lottoContent, LOTTO_CONTENT_DECLARATION } from './game-content';
import { lettersProvider, readingProvider, shapesProvider } from './providers';

describe('Lotto content declaration', () => {
	it('should declare letters, shapes, reading — in this order — with letters as default', () => {
		expect(LOTTO_CONTENT_DECLARATION).toEqual({
			gameId: 'lotto-game',
			providerIds: ['letters', 'shapes', 'reading'],
			defaultProviderId: 'letters'
		});
	});

	it('should register all three providers in the registry', () => {
		expect(contentRegistry.getOrThrow('letters')).toBe(lettersProvider);
		expect(contentRegistry.getOrThrow('shapes')).toBe(shapesProvider);
		expect(contentRegistry.getOrThrow('reading')).toBe(readingProvider);
	});

	it('should resolve providers in declaration order', () => {
		expect(lottoContent.gameId).toBe('lotto-game');
		expect(lottoContent.providers).toEqual([lettersProvider, shapesProvider, readingProvider]);
		expect(lottoContent.defaultProvider).toBe(lettersProvider);
	});

	it('every provider should be a valid kit ContentProvider', () => {
		lottoContent.providers.forEach((provider) => {
			expect(isContentProvider(provider)).toBe(true);
		});
	});

	it('should fall back to letters for an unknown persisted provider id', () => {
		expect(lottoContent.resolveProviderId('shapes')).toBe('shapes');
		expect(lottoContent.resolveProviderId('colors')).toBe('letters');
		expect(lottoContent.resolveProviderId(undefined)).toBe('letters');
		expect(lottoContent.getProvider('reading')).toBe(readingProvider);
		expect(lottoContent.getProvider('nope')).toBe(lettersProvider);
	});

	it('registry.get should return err for an unknown provider', () => {
		expect(contentRegistry.get('nope').isErr()).toBe(true);
		expect(() => contentRegistry.getOrThrow('nope')).toThrow('Provider with id "nope" not found');
	});
});

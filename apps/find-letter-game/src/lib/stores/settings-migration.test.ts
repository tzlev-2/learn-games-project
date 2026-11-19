import { describe, it, expect } from 'vitest';
import {
	migrateLegacyToV5,
	migrateV5ToV6,
	migrateSettings,
	FIND_LETTER_SETTINGS_VERSION
} from './settings-migration';
import { DEFAULT_LETTER_IDS } from 'learn-booster-kit/content/hebrew-letters';

// בדיקה M1: migration מגרסה 2 עם base → 21 IDs
test('migration מגרסה 2 עם base → 21 IDs', () => {
	const result = migrateLegacyToV5({ schemaVersion: 2, activeGroups: ['base'] });
	expect(result.selectedLetterIds).toHaveLength(21);
	expect(result.selectedLetterIds).toContain('a');
	expect(result.selectedLetterIds).toContain('tav');
});

// בדיקה M2: migration מגרסה 2 עם כל הקבוצות → 26 IDs
test('migration מגרסה 2 עם כל הקבוצות → 26 IDs', () => {
	const result = migrateLegacyToV5({ schemaVersion: 2, activeGroups: ['base', 'confusing', 'rafe'] });
	expect(result.selectedLetterIds).toHaveLength(26);
});

// בדיקה M3: migration מגרסה 2 לא מחזיר activeGroups
test('migration מגרסה 2 לא מחזיר activeGroups', () => {
	const result = migrateLegacyToV5({ schemaVersion: 2, activeGroups: ['base'] }) as Record<string, unknown>;
	expect(result.activeGroups).toBeUndefined();
});

// בדיקה M4: migration מגרסה 3 מחזיר selectedLetterIds כמו שהוא
test('migration מגרסה 3 מחזיר selectedLetterIds כמו שהוא', () => {
	const result = migrateLegacyToV5({ schemaVersion: 3, selectedLetterIds: ['a', 'ba'] });
	expect(result.selectedLetterIds).toEqual(['a', 'ba']);
});

// בדיקה M5: migration על null מחזיר אובייקט ריק
test('migration על null מחזיר אובייקט ריק', () => {
	expect(migrateLegacyToV5(null)).toEqual({});
	expect(migrateLegacyToV5('bad')).toEqual({});
	expect(migrateLegacyToV5(undefined)).toEqual({});
});

// === Sub-phase 1.3: Tests חדשים ל-v3→v5 ===

// בדיקה M6: migration מגרסה 3 → v5: מוסיף selectedVowels=['patah'] ו-schemaVersion=5
test('migration מגרסה 3 → v5: מוסיף selectedVowels ו-schemaVersion=5', () => {
	const result = migrateLegacyToV5({ schemaVersion: 3, selectedLetterIds: ['ba', 'ga'] });
	expect((result as Record<string, unknown>).selectedVowels).toEqual(['patah']);
	expect((result as Record<string, unknown>).schemaVersion).toBe(5);
});

// בדיקה M7: migration מגרסה 5 → מחזיר כמו שהוא
test('migration מגרסה 5 → מחזיר selectedLetterIds וselectedVowels כמו שהם', () => {
	const result = migrateLegacyToV5({
		schemaVersion: 5,
		selectedLetterIds: ['ba', 'ga'],
		selectedVowels: ['patah']
	});
	expect(result.selectedLetterIds).toEqual(['ba', 'ga']);
	expect((result as Record<string, unknown>).selectedVowels).toEqual(['patah']);
});

// בדיקה M8: migration מגרסה 2 עם base → schemaVersion=5 ו-selectedVowels=['patah']
test('migration מגרסה 2 עם base → schemaVersion=5 ו-selectedVowels', () => {
	const result = migrateLegacyToV5({ schemaVersion: 2, activeGroups: ['base'] }) as Record<string, unknown>;
	expect(result.schemaVersion).toBe(5);
	expect(result.selectedVowels).toEqual(['patah']);
	expect(result.activeGroups).toBeUndefined();
});

// בדיקה M9 — edge case: legacy v2 עם activeGroups=['base'] → selectedVowels=['patah'] ו-schemaVersion=5
test('legacy v2 עם activeGroups=[base] → selectedVowels=[patah] ו-schemaVersion=5', () => {
	const result = migrateLegacyToV5({
		schemaVersion: 2,
		activeGroups: ['base'],
		gridSize: '3x4',
		avoidSimilar: true
	}) as Record<string, unknown>;
	expect(result.selectedVowels).toEqual(['patah']);
	expect(result.schemaVersion).toBe(5);
	expect(result.selectedLetterIds).toHaveLength(21);
	// שדות נוספים נשמרים
	expect(result.gridSize).toBe('3x4');
});

// === v4 → v5: סינון חטף-פתח וחטף-סגול ===

// בדיקה M10: v4 עם חטף-פתח ב-selectedVowels → מסונן, schemaVersion עולה ל-5
test('migration מ-v4 → v5: מסנן hataf-patah ו-hataf-segol', () => {
	const result = migrateLegacyToV5({
		schemaVersion: 4,
		selectedLetterIds: ['ba'],
		selectedVowels: ['patah', 'hataf-patah', 'hirik', 'hataf-segol']
	}) as Record<string, unknown>;
	expect(result.selectedVowels).toEqual(['patah', 'hirik']);
	expect(result.schemaVersion).toBe(5);
});

// בדיקה M11: v4 עם רק חטפים → fallback ל-['patah']
test('migration מ-v4 → v5: רק חטפים נבחרו → fallback ל-patah', () => {
	const result = migrateLegacyToV5({
		schemaVersion: 4,
		selectedLetterIds: ['ba'],
		selectedVowels: ['hataf-patah', 'hataf-segol']
	}) as Record<string, unknown>;
	expect(result.selectedVowels).toEqual(['patah']);
	expect(result.schemaVersion).toBe(5);
});

// בדיקה M12: v4 בלי חטפים → רק עולה ל-v5 בלי שינוי תוכן
test('migration מ-v4 → v5: בלי חטפים → תוכן זהה, schemaVersion עולה', () => {
	const result = migrateLegacyToV5({
		schemaVersion: 4,
		selectedLetterIds: ['ba'],
		selectedVowels: ['patah', 'hirik']
	}) as Record<string, unknown>;
	expect(result.selectedVowels).toEqual(['patah', 'hirik']);
	expect(result.schemaVersion).toBe(5);
});

// === v6: ContentProvider רב-צירי (platform-plan שלב 3) ===

describe('migrateSettings → v6', () => {
	const v5 = {
		schemaVersion: 5,
		gridSize: '3x3',
		autoSpeakOnNewRound: false,
		voiceEnabled: true,
		boosterEnabled: true,
		selectedLetterIds: ['ba', 'ga', 'va_rafe'],
		selectedVowels: ['patah', 'hirik'],
		avoidSimilar: false,
		cooldownMs: 3000,
		questionsPerBoard: 4,
		boardsPerSet: 2
	};

	it('v5 → v6: הבחירה עוברת ל-contentSelections של hebrew-letters, שאר השדות נשמרים', () => {
		const r = migrateSettings(v5) as Record<string, unknown>;
		expect(r.schemaVersion).toBe(6);
		expect(FIND_LETTER_SETTINGS_VERSION).toBe(6);
		expect(r.contentProviderId).toBe('hebrew-letters');
		expect(r.contentSelections).toEqual({
			'hebrew-letters': { letters: ['ba', 'ga', 'va_rafe'], vowels: ['patah', 'hirik'] }
		});
		expect(r.selectedLetterIds).toBeUndefined();
		expect(r.selectedVowels).toBeUndefined();
		expect(r).toMatchObject({ gridSize: '3x3', autoSpeakOnNewRound: false, avoidSimilar: false, cooldownMs: 3000, questionsPerBoard: 4, boardsPerSet: 2 });
	});

	it('אידמפוטנטית: v6 → v6 (המנוע של הקיט יכול להריץ אותה כמה פעמים)', () => {
		const once = migrateSettings(v5);
		const twice = migrateSettings(once);
		const thrice = migrateSettings(migrateSettings(twice));
		expect(twice).toEqual(once);
		expect(thrice).toEqual(once);
	});

	it('v2 (activeGroups) → v6 בקריאה אחת', () => {
		const r = migrateSettings({ schemaVersion: 2, activeGroups: ['rafe'], gridSize: '2x3' }) as Record<string, unknown>;
		expect(r.schemaVersion).toBe(6);
		expect(r.gridSize).toBe('2x3');
		expect(r.contentSelections).toEqual({
			'hebrew-letters': { letters: ['va_rafe', 'cha_rafe', 'fa_rafe'], vowels: ['patah'] }
		});
	});

	it('v4 עם חטפים → v6 בלי חטפים', () => {
		const r = migrateSettings({ schemaVersion: 4, selectedLetterIds: ['ba', 'ga'], selectedVowels: ['hataf-patah', 'segol'] }) as Record<string, unknown>;
		expect(r.contentSelections).toEqual({ 'hebrew-letters': { letters: ['ba', 'ga'], vowels: ['segol'] } });
	});

	it('v5 עם שדות בחירה חסרים/לא תקינים → ברירות המחדל של ה-Provider', () => {
		const r = migrateV5ToV6({ schemaVersion: 5, selectedLetterIds: 'oops' });
		expect(r.contentSelections).toEqual({
			'hebrew-letters': { letters: [...DEFAULT_LETTER_IDS], vowels: ['patah'] }
		});
	});

	it('v6 עם בחירה לא תקינה — הבחירה נזרקת (המשחק ייפול לברירת המחדל), שאר השדות נשמרים', () => {
		const r = migrateSettings({
			schemaVersion: 6,
			gridSize: '4x4',
			contentProviderId: 'hebrew-letters',
			contentSelections: { 'hebrew-letters': { letters: [1, 2] }, other: { x: ['y'] } }
		}) as Record<string, unknown>;
		expect(r.gridSize).toBe('4x4');
		expect(r.contentSelections).toEqual({ other: { x: ['y'] } });
	});

	it('v6 בלי contentProviderId → hebrew-letters', () => {
		const r = migrateSettings({ schemaVersion: 6, contentSelections: {} }) as Record<string, unknown>;
		expect(r.contentProviderId).toBe('hebrew-letters');
	});

	it('קלט לא תקין / גרסה לא ידועה → {}', () => {
		expect(migrateSettings(null)).toEqual({});
		expect(migrateSettings('bad')).toEqual({});
		expect(migrateSettings({ schemaVersion: 99 })).toEqual({});
	});
});

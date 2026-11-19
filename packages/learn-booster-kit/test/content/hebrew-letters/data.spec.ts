/**
 * Tests for letters.ts data module (Sub-phase 1.1)
 */
import { describe, it, expect } from 'vitest';
import { ALL_LETTERS_DATA } from '../../../src/content/providers/hebrew-letters';
import { ALL_LETTERS } from './helpers';
import { ALL_VOWELS, VOWELS_BY_CODE } from '../../../src/content/providers/hebrew-letters';

describe('letters data module', () => {
	it('מכיל בדיוק 26 ערכי Letter', () => {
		expect(ALL_LETTERS_DATA).toHaveLength(26);
	});

	it('כל legacyCardId ייחודי', () => {
		const ids = ALL_LETTERS_DATA.map((l) => l.legacyCardId);
		const unique = new Set(ids);
		expect(unique.size).toBe(26);
	});

	it('כל id ייחודי', () => {
		const ids = ALL_LETTERS_DATA.map((l) => l.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(26);
	});

	it('כל legacyCardId קיים ב-ALL_LETTERS הישן', () => {
		const oldIds = new Set(ALL_LETTERS.map((c) => c.id));
		for (const letter of ALL_LETTERS_DATA) {
			expect(oldIds.has(letter.legacyCardId)).toBe(true);
		}
	});

	it('כל Letter מכיל את השדות הנדרשים', () => {
		for (const letter of ALL_LETTERS_DATA) {
			expect(typeof letter.id).toBe('string');
			expect(typeof letter.char).toBe('string');
			expect(typeof letter.displayChar).toBe('string');
			expect(typeof letter.name).toBe('string');
			expect(typeof letter.hasDagesh).toBe('boolean');
			expect(typeof letter.isFinalForm).toBe('boolean');
			expect(typeof letter.group).toBe('string');
			expect(typeof letter.legacyCardId).toBe('string');
		}
	});

	it('ב (ba) מוגדר נכון עם hasDagesh=true', () => {
		const b = ALL_LETTERS_DATA.find((l) => l.legacyCardId === 'ba');
		expect(b).toBeDefined();
		expect(b!.hasDagesh).toBe(true);
		expect(b!.char).toBe('ב');
		expect(b!.legacyCardId).toBe('ba');
	});

	it('va_rafe מוגדר נכון עם hasDagesh=false', () => {
		const vaRafe = ALL_LETTERS_DATA.find((l) => l.legacyCardId === 'va_rafe');
		expect(vaRafe).toBeDefined();
		expect(vaRafe!.hasDagesh).toBe(false);
		expect(vaRafe!.isFinalForm).toBe(false);
	});

	it('sha מכיל sinSide=right', () => {
		const sha = ALL_LETTERS_DATA.find((l) => l.legacyCardId === 'sha');
		expect(sha).toBeDefined();
		expect(sha!.sinSide).toBe('right');
	});

	it('sa_sin מכיל sinSide=left', () => {
		const saSin = ALL_LETTERS_DATA.find((l) => l.legacyCardId === 'sa_sin');
		expect(saSin).toBeDefined();
		expect(saSin!.sinSide).toBe('left');
	});

	it('אף אות לא isFinalForm=true בפאזה 1 (אין סופיות עדיין)', () => {
		// בפאזה 1 אנחנו עם 26 האותיות שכולן non-final
		// סופיות יוצגו בפאזה 4
		const finals = ALL_LETTERS_DATA.filter((l) => l.isFinalForm);
		expect(finals).toHaveLength(0);
	});
});

// ─── vowels (הועבר מ-find-letter data/vowels.test.ts) ───

describe('vowels data module', () => {
	it('מכיל בדיוק 10 ערכי Vowel', () => {
		expect(ALL_VOWELS).toHaveLength(10);
	});

	it('קודים ייחודיים', () => {
		const codes = ALL_VOWELS.map((v) => v.code);
		const unique = new Set(codes);
		expect(unique.size).toBe(10);
	});

	it('hataf-patah ו-hataf-segol לא קיימים יותר', () => {
		const codes = ALL_VOWELS.map((v) => v.code);
		expect(codes).not.toContain('hataf-patah');
		expect(codes).not.toContain('hataf-segol');
	});

	it('מכיל patah', () => {
		const patah = VOWELS_BY_CODE['patah'];
		expect(patah).toBeDefined();
		expect(patah.code).toBe('patah');
	});

	it('מכיל none', () => {
		const none = VOWELS_BY_CODE['none'];
		expect(none).toBeDefined();
		expect(none.code).toBe('none');
	});

	it('patah: mark=פתח (ַ), speakSuffix מסתיים ב-א', () => {
		const patah = VOWELS_BY_CODE['patah'];
		// הפתח הוא ַ (U+05B7)
		expect(patah.mark).toBe('\u05B7');
		// speakSuffix כולל א בסוף (ל-TTS)
		expect(patah.speakSuffix.endsWith('א')).toBe(true);
	});

	it('none: mark ריק, speakSuffix הוא שווא נח', () => {
		const none = VOWELS_BY_CODE['none'];
		expect(none.mark).toBe('');
		// שווא נח: U+05B0
		expect(none.speakSuffix).toContain('\u05B0');
	});

	it('כל Vowel מכיל displayName שאינו ריק', () => {
		for (const vowel of ALL_VOWELS) {
			expect(typeof vowel.displayName).toBe('string');
			expect(vowel.displayName.length).toBeGreaterThan(0);
		}
	});

	// === ניקודים חדשים (פאזה 3) ===

	it('kamatz: mark=ָ (U+05B8), speakSuffix מסתיים ב-א', () => {
		const kamatz = VOWELS_BY_CODE['kamatz'];
		expect(kamatz).toBeDefined();
		expect(kamatz.mark).toBe('\u05B8'); // ָ
		expect(kamatz.speakSuffix.endsWith('א')).toBe(true);
		expect(kamatz.displayName).toBe('קמץ');
	});

	it('segol: mark=ֶ (U+05B6), speakSuffix מסתיים ב-א', () => {
		const segol = VOWELS_BY_CODE['segol'];
		expect(segol).toBeDefined();
		expect(segol.mark).toBe('\u05B6'); // ֶ
		expect(segol.speakSuffix.endsWith('א')).toBe(true);
		expect(segol.displayName).toBe('סגול');
	});

	it('tzere: mark=ֵ (U+05B5), speakSuffix מסתיים ב-א', () => {
		const tzere = VOWELS_BY_CODE['tzere'];
		expect(tzere).toBeDefined();
		expect(tzere.mark).toBe('\u05B5'); // ֵ
		expect(tzere.speakSuffix.endsWith('א')).toBe(true);
		expect(tzere.displayName).toBe('צירה');
	});

	it('hirik: mark=ִ (U+05B4), speakSuffix מסתיים ב-יוד', () => {
		const hirik = VOWELS_BY_CODE['hirik'];
		expect(hirik).toBeDefined();
		expect(hirik.mark).toBe('\u05B4'); // ִ
		expect(hirik.speakSuffix.endsWith('י')).toBe(true);
		expect(hirik.displayName).toBe('חיריק');
	});

	it('kubutz: mark=ֻ (U+05BB)', () => {
		const kubutz = VOWELS_BY_CODE['kubutz'];
		expect(kubutz).toBeDefined();
		expect(kubutz.mark).toBe('\u05BB'); // ֻ
		expect(kubutz.displayName).toBe('קובוץ');
	});

	it('shuruk: mark=וּ (U+05D5+U+05BC) — 2 chars', () => {
		const shuruk = VOWELS_BY_CODE['shuruk'];
		expect(shuruk).toBeDefined();
		// שורוק = ו + דגש (2 chars!)
		expect(shuruk.mark).toBe('\u05D5\u05BC');
		expect([...shuruk.mark].length).toBe(2); // 2 code points
		expect(shuruk.displayName).toBe('שורוק');
	});

	it('holam: mark=ֹ (U+05B9), speakSuffix מסתיים ב-א', () => {
		const holam = VOWELS_BY_CODE['holam'];
		expect(holam).toBeDefined();
		expect(holam.mark).toBe('\u05B9'); // ֹ
		expect(holam.speakSuffix.endsWith('א')).toBe(true);
		expect(holam.displayName).toBe('חולם');
	});

	it('shva: mark=ְ (U+05B0)', () => {
		const shva = VOWELS_BY_CODE['shva'];
		expect(shva).toBeDefined();
		expect(shva.mark).toBe('\u05B0'); // ְ
		expect(shva.displayName).toBe('שווא');
	});

	// סדר פדגוגי: patah, kamatz, hirik, segol, tzere, holam, shuruk, kubutz, shva, none
	it('הסדר הפדגוגי ב-ALL_VOWELS: patah ראשון, none אחרון', () => {
		expect(ALL_VOWELS[0].code).toBe('patah');
		expect(ALL_VOWELS[ALL_VOWELS.length - 1].code).toBe('none');
	});
});

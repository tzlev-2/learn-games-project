/**
 * מאגר סוגי ניקוד.
 *
 * הניקודים בסדר פדגוגי:
 * patah, kamatz, hirik, segol, tzere, holam, shuruk, kubutz, shva, none
 *
 * שימו לב על ה-speakSuffix:
 *   - patah: 'ָא' (קמץ U+05B8 + אלף) — TTS יציב כמו הישן
 *   - kamatz: 'ָא' — זהה צלילית לפתח (אותו MP3 בעתיד)
 *   - hirik: 'ִי' (חיריק + יוד) — חיריק מסיים ב-יוד
 *   - kubutz: 'ֻ' — קצר, בלי תוספת
 *   - shuruk: 'וּ' (U+05D5 + U+05BC) — שני chars, ראה §Special handling
 *   - shva: 'ְ' — שווא נע, זהה לnone
 *   - none: 'ְ' — שווא נח (עיצור)
 *
 * הועבר מ-`apps/find-letter-game/src/lib/data/vowels.ts` (platform-plan שלב 4).
 * מסמך תכנון: apps/find-letter-game/docs/plans/vowels-support-plan.md §3 ו-§4
 */

import { hebrewLettersLanguage as language } from './language';

export type VowelCode =
	| 'patah'
	| 'kamatz'
	| 'hirik'
	| 'segol'
	| 'tzere'
	| 'holam'
	| 'shuruk'
	| 'kubutz'
	| 'shva'
	| 'none';

export interface Vowel {
	code: VowelCode;
	/** שם הניקוד בעברית — מ-language.ts */
	displayName: string;
	/** הסימן המשלים (combining character) לתצוגה — ריק עבור none */
	mark: string;
	/**
	 * הסיומת ל-speak: נוסף אחרי letter.displayChar.
	 * עבור patah: 'ָא' — כדי שה-speak יהיה זהה לישן ('בָּא', 'גָא', etc.)
	 * עבור none: 'ְ' — שווא נח ('בְּ', 'גְ', etc.)
	 */
	speakSuffix: string;
}

export const VOWELS_BY_CODE: Record<VowelCode, Vowel> = {
	patah: {
		code: 'patah',
		displayName: language.vowelNames.patah,
		mark: '\u05B7', // ַ (U+05B7)
		// קמץ (ָ U+05B8) + אלף — ל-TTS יציב בדיוק כמו הישן
		speakSuffix: '\u05B8\u05D0' // ָא
	},
	kamatz: {
		code: 'kamatz',
		displayName: language.vowelNames.kamatz,
		mark: '\u05B8', // ָ (U+05B8)
		// זהה צלילית לפתח — אותו MP3 בעתיד (ראה vowels-support-plan.md §4.3)
		speakSuffix: '\u05B8\u05D0' // ָא
	},
	hirik: {
		code: 'hirik',
		displayName: language.vowelNames.hirik,
		mark: '\u05B4', // ִ (U+05B4)
		// חיריק מסיים ב-יוד
		speakSuffix: '\u05B4\u05D9' // ִי
	},
	segol: {
		code: 'segol',
		displayName: language.vowelNames.segol,
		mark: '\u05B6', // ֶ (U+05B6)
		speakSuffix: '\u05B6\u05D0' // ֶא
	},
	tzere: {
		code: 'tzere',
		displayName: language.vowelNames.tzere,
		mark: '\u05B5', // ֵ (U+05B5)
		speakSuffix: '\u05B5\u05D0' // ֵא
	},
	holam: {
		code: 'holam',
		displayName: language.vowelNames.holam,
		mark: '\u05B9', // ֹ (U+05B9)
		speakSuffix: '\u05B9\u05D0' // ֹא
	},
	shuruk: {
		code: 'shuruk',
		displayName: language.vowelNames.shuruk,
		// שורוק = ו (U+05D5) + דגש (U+05BC) — שני chars!
		mark: '\u05D5\u05BC', // וּ
		// speakSuffix זהה ל-mark
		speakSuffix: '\u05D5\u05BC' // וּ
	},
	kubutz: {
		code: 'kubutz',
		displayName: language.vowelNames.kubutz,
		mark: '\u05BB', // ֻ (U+05BB)
		// קצר — בלי תוספת
		speakSuffix: '\u05BB' // ֻ
	},
	shva: {
		code: 'shva',
		displayName: language.vowelNames.shva,
		mark: '\u05B0', // ְ (U+05B0)
		// שווא נע — זהה צלילית ל-none
		speakSuffix: '\u05B0' // ְ
	},
	none: {
		code: 'none',
		displayName: language.vowelNames.none,
		mark: '',
		// שווא נח U+05B0 — "בְּ", "גְ"
		speakSuffix: '\u05B0' // ְ
	}
};

// סדר פדגוגי: patah → kamatz → hirik → segol → tzere → holam → shuruk → kubutz → shva → none
export const ALL_VOWELS: readonly Vowel[] = [
	VOWELS_BY_CODE.patah,
	VOWELS_BY_CODE.kamatz,
	VOWELS_BY_CODE.hirik,
	VOWELS_BY_CODE.segol,
	VOWELS_BY_CODE.tzere,
	VOWELS_BY_CODE.holam,
	VOWELS_BY_CODE.shuruk,
	VOWELS_BY_CODE.kubutz,
	VOWELS_BY_CODE.shva,
	VOWELS_BY_CODE.none
];

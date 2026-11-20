/**
 * מיפוי טקסטי הקראה (`speak`) → קבצי MP3 מוקלטים ב-CDN הסטטי.
 *
 * הקבצים אוחסנו ב-R2 (`tzlev-static`) תחת
 * `${VITE_STATIC_BASE_URL}/shared/tts/find-letter/<filename>`,
 * נוצרו דרך ElevenLabs (Sarah/eleven_v3) ואושרו ידנית (פתח + עיצור)
 * או נוצרו כ-batch לכל ניקוד (איכות לא נבדקה מקצה לקצה, ראו `tts-review/`
 * ב-find-letter).
 *
 * המיפוי הוא חלק מהתוכן: הוא קובע לאילו צירופים יש הקלטה. המשחק אחראי על
 * הניגון (fetch, cache, fallback ל-Web Speech) — ראו `TTS_STATIC_PATH`.
 *
 * הועבר מ-`apps/find-letter-game/src/lib/utils/letters.ts` (platform-plan שלב 4).
 */

import { VOWELS_BY_CODE, type VowelCode } from './vowels';

/** הנתיב (יחסי ל-VITE_STATIC_BASE_URL) שבו יושבים קבצי ה-MP3 */
export const TTS_STATIC_PATH = '/shared/tts/find-letter';

/*
 * הערה על ה-`speak`:
 *
 * ה-TTS (ElevenLabs eleven_v3) נוטה "ליישר" אותיות גרוניות לעברית מודרנית.
 * כשמסיימים מילה ב-`ה` (אם-קריאה), המודל לפעמים מבלע את העיצור הראשון
 * ובמיוחד גורם ל-`ח` להישמע כמו `ה`, ל-`ט` להישמע כמו `ה`, וכו'.
 * הפתרון: לסיים את ה-`speak` ב-`א` במקום `ה`.
 *
 * חריג: `fa_rafe` משתמש בתעתיק לטיני (`Fa`) כי Sarah/eleven_v3 מתעלם באופן
 * עקבי מהבחנת דגש/רפה של פ' בעברית — כל וריאנט עברי יצא Pa במקום Fa.
 * בתעתיק לטיני המודל קורא את ההברה כמו שהיא נכתבת.
 *
 * אומת מול Gemini transcription על כל הקבצים — ראו apps/find-letter-game/docs/walkthrough.md.
 */

/**
 * מיפוי בסיסי של speak → קובץ עבור פתח ועיצור (פאזות 1-2).
 * הקבצים כאן יושבים flat בתוך `shared/tts/find-letter/`.
 */
const TTS_FILES_BASE: Record<string, string> = {
	// ===== פתח — פאזה 1 =====
	אָא: 'A.mp3',
	בָּא: 'Ba.mp3',
	גָא: 'Ga.mp3',
	דָא: 'Da.mp3',
	הָא: 'Ha.mp3',
	וָא: 'Va.mp3',
	זַה: 'Za.mp3',
	חָא: 'Cha.mp3',
	טָא: 'Ta.mp3',
	יָא: 'Ya.mp3',
	כָּא: 'Ka.mp3',
	לָא: 'La.mp3',
	מָא: 'Ma.mp3',
	נָא: 'Na.mp3',
	סָא: 'Sa.mp3',
	פָּא: 'Pa.mp3',
	'[Israeli accent] צַה': 'Tsa.mp3',
	רָא: 'Ra.mp3',
	שָׁא: 'Sha.mp3',
	Fa: 'Fa.mp3',

	// ===== קמץ — שיתוף עם פתח =====
	// קמץ ב-data מייצר speak = (speakChar ?? char) + 'ָא'. עבור אותיות
	// שבהן char ≡ displayChar וללא חריגים — speak זהה לפתח ומכוסה למעלה.
	// כאן רק האותיות שבהן speak הקמץ שונה מ-legacySpeakPatah:
	'בָא': 'Ba.mp3', // b: char='ב' בלי דגש בניגוד לפתח 'בָּא'
	'כָא': 'Ka.mp3', // k: char='כ' בלי דגש בניגוד לפתח 'כָּא'
	'פָא': 'Pa.mp3', // p: char='פ' בלי דגש בניגוד לפתח 'פָּא'
	'תָא': 'Ta.mp3', // tav: char='ת' בעוד פתח='טָא'
	'זָא': 'Za.mp3', // z: פתח='זַה' (חריג)
	'צָא': 'Tsa.mp3', // tz: פתח='[Israeli accent] צַה'
	'קָא': 'Ka.mp3', // q: char='ק' בעוד פתח='כָּא'
	'עָא': 'A.mp3',   // aa: char='ע' בעוד פתח='אָא'
	'שָא': 'Sha.mp3', // sh + sin: char='ש' בלי שיניים בניגוד לפתח 'שָׁא'
	// eslint-disable-next-line no-misleading-character-class -- Intentional: Latin F + Hebrew kamatz+aleph
	'Fָא': 'Fa.mp3', // f_rafe: speakChar='F' + 'ָא' (פתח='Fa')

	// ===== עיצור (none) — פאזה 2 =====
	// ב: char='ב' → 'בְ'. גם va_rafe עם speakChar='ו' מייצר 'וְ' → V.mp3
	'בְ': 'B.mp3',
	'גְ': 'G.mp3',    // [Israeli accent] גְ
	'דְ': 'D.mp3',
	'הְ': 'H.mp3',
	'וְ': 'V.mp3',    // v (ו) + va_rafe (speakChar='ו')
	'זְ': 'Z.mp3',    // [Israeli accent] זְ
	'חְ': 'Ch.mp3',   // ch (ח) + cha_rafe (speakChar='ח')
	'טְ': 'T.mp3',    // [Israeli accent] טְ
	'יְ': 'Y.mp3',    // [Israeli accent] יְ
	'כְ': 'K.mp3',    // [Israeli accent] כְּ
	'לְ': 'L.mp3',
	'מְ': 'M.mp3',    // [Israeli accent] מְ
	'נְ': 'N.mp3',
	'סְ': 'S.mp3',    // [Israeli accent] סְ
	'פְ': 'P.mp3',    // p (פּ דגושה, char='פ')
	'צְ': 'Tz.mp3',   // [Israeli accent] צְ
	'קְ': 'K.mp3',    // q (ק) — אותו צליל כ-כּ (כמו בסיבוב 1)
	'רְ': 'R.mp3',    // פשרה — American R
	// sh (שׁ) + sin (שׂ): שניהם char='ש' → speak='שְ'. ה-TTS מפיק צליל shin.
	// sin אמורה לצלול כ-S אבל אין דרך להפריד בלי speakChar (מחוץ לscope).
	'שְ': 'Sh.mp3',
	'תְ': 'T.mp3',    // tav (ת) — אותו צליל כ-ט (כמו בסיבוב 1)
	// fa_rafe: speakChar='F' → speak='Fְ' (Latin F + שווא) → נפרד מ-P.mp3
	// eslint-disable-next-line no-misleading-character-class -- Intentional: Latin F + Hebrew shva
	'Fְ': 'F.mp3',

	// ===== גרוניות + עיצור — פאזה 2 (ממתין להחלטה) =====
	// 'אְ': 'A-consonant.mp3',  ← יוסף אחרי NEEDS_DECISION
	// 'עְ': 'Aa-consonant.mp3', ← יוסף אחרי NEEDS_DECISION
};

/**
 * בסיסי שמות קבצים פר ניקוד פר speakBase (char או speakChar של האות).
 * speakBase 'ש' משותף ל-sh ול-sin (TTS מייצר צליל shin — מקובל כפי שב-shva).
 * speakBase 'ו' משותף ל-v ול-v_rafe. 'ח' ל-ch ול-ch_rafe. 'F' ל-f_rafe.
 *
 * כל קובץ יושב בתיקיית-משנה משלו ב-R2: `shared/tts/find-letter/<dir>/<file>.mp3`.
 * tzere, kubutz — לכל אחד יש דירקטוריה ייעודית עם הקלטות נפרדות
 * (גם אם השמיעה הסופית יכולה להתאים לסגול/שורוק).
 */
const VOWEL_FILE_INFO: Record<
	Exclude<VowelCode, 'patah' | 'kamatz' | 'shva' | 'none'>,
	{ dir: string; bases: Record<string, string> }
> = {
	hirik: {
		dir: 'hirik',
		bases: {
			'א': 'Ai', 'ב': 'Bi', 'ג': 'Gi', 'ד': 'Di', 'ה': 'Hi',
			'ו': 'Vi', 'ז': 'Zi', 'ח': 'Chi', 'ט': 'Ti', 'י': 'Yi',
			'כ': 'Ki', 'ל': 'Li', 'מ': 'Mi', 'נ': 'Ni', 'ס': 'Si',
			'ע': 'Aai', 'פ': 'Pi', 'צ': 'Tsai', 'ק': 'Qi', 'ר': 'Ri',
			'ש': 'Shi', 'ת': 'Tavi', F: 'Fi'
		}
	},
	segol: {
		dir: 'segol',
		bases: {
			'א': 'Ae', 'ב': 'Be', 'ג': 'Ge', 'ד': 'De', 'ה': 'He',
			'ו': 'Ve', 'ז': 'Ze', 'ח': 'Che', 'ט': 'Te', 'י': 'Ye',
			'כ': 'Ke', 'ל': 'Le', 'מ': 'Me', 'נ': 'Ne', 'ס': 'Se',
			'ע': 'Aae', 'פ': 'Pe', 'צ': 'Tsae', 'ק': 'Qe', 'ר': 'Re',
			'ש': 'She', 'ת': 'Tave', F: 'Fe'
		}
	},
	tzere: {
		dir: 'tzere',
		bases: {
			'א': 'Aei', 'ב': 'Bei', 'ג': 'Gei', 'ד': 'Dei', 'ה': 'Hei',
			'ו': 'Vei', 'ז': 'Zei', 'ח': 'Chei', 'ט': 'Tei', 'י': 'Yei',
			'כ': 'Kei', 'ל': 'Lei', 'מ': 'Mei', 'נ': 'Nei', 'ס': 'Sei',
			'ע': 'Aaei', 'פ': 'Pei', 'צ': 'Tsaei', 'ק': 'Qei', 'ר': 'Rei',
			'ש': 'Shei', 'ת': 'Tavei', F: 'Fei'
		}
	},
	holam: {
		dir: 'holam',
		bases: {
			'א': 'Ao', 'ב': 'Bo', 'ג': 'Go', 'ד': 'Do', 'ה': 'Ho',
			'ו': 'Vo', 'ז': 'Zo', 'ח': 'Cho', 'ט': 'To', 'י': 'Yo',
			'כ': 'Ko', 'ל': 'Lo', 'מ': 'Mo', 'נ': 'No', 'ס': 'So',
			'ע': 'Aao', 'פ': 'Po', 'צ': 'Tsao', 'ק': 'Qo', 'ר': 'Ro',
			'ש': 'Sho', 'ת': 'Tavo', F: 'Fo'
		}
	},
	shuruk: {
		dir: 'shuruk',
		bases: {
			'א': 'Au', 'ב': 'Bu', 'ג': 'Gu', 'ד': 'Du', 'ה': 'Hu',
			'ו': 'Vu', 'ז': 'Zu', 'ח': 'Chu', 'ט': 'Tu', 'י': 'Yu',
			'כ': 'Ku', 'ל': 'Lu', 'מ': 'Mu', 'נ': 'Nu', 'ס': 'Su',
			'ע': 'Aau', 'פ': 'Pu', 'צ': 'Tsau', 'ק': 'Qu', 'ר': 'Ru',
			'ש': 'Shu', 'ת': 'Tavu', F: 'Fu'
		}
	},
	kubutz: {
		dir: 'kubutz',
		bases: {
			'א': 'Auu', 'ב': 'Buu', 'ג': 'Guu', 'ד': 'Duu', 'ה': 'Huu',
			'ו': 'Vuu', 'ז': 'Zuu', 'ח': 'Chuu', 'ט': 'Tuu', 'י': 'Yuu',
			'כ': 'Kuu', 'ל': 'Luu', 'מ': 'Muu', 'נ': 'Nuu', 'ס': 'Suu',
			'ע': 'Aauu', 'פ': 'Puu', 'צ': 'Tsauu', 'ק': 'Quu', 'ר': 'Ruu',
			'ש': 'Shuu', 'ת': 'Tavuu', F: 'Fuu'
		}
	}
};

/**
 * בונה את המיפוי המורחב על-ידי חיבור bases × speakSuffix של הניקוד.
 * שווה-ערך ל-key שמיוצר ב-runtime על ידי `makePair` (speakChar ?? char + speakSuffix).
 */
const TTS_FILES_VOWELS: Record<string, string> = (() => {
	const out: Record<string, string> = {};
	for (const [vowelCode, { dir, bases }] of Object.entries(VOWEL_FILE_INFO)) {
		const vowel = VOWELS_BY_CODE[vowelCode as VowelCode];
		const suffix = vowel.speakSuffix;
		for (const [base, filename] of Object.entries(bases)) {
			const key = (base + suffix).normalize('NFC');
			out[key] = `${dir}/${filename}.mp3`;
		}
	}
	return out;
})();

/**
 * מיפוי טקסטי הקראה (`speak`) → נתיב יחסי לקובץ MP3 ב-CDN הסטטי.
 *
 * הקבצים אוחסנו ב-R2 (`tzlev-static`) תחת
 * `${VITE_STATIC_BASE_URL}/shared/tts/find-letter/<filename>`,
 * נוצרו דרך ElevenLabs (Sarah/eleven_v3) ואושרו ידנית (פתח + עיצור)
 * או נוצרו כ-batch לכל ניקוד (חיריק, סגול, צירי, חולם, שורוק, קובוץ,
 * חטף-פתח, חטף-סגול — איכות לא נבדקה מקצה לקצה, ראו `tts-review/`).
 *
 * המיפוי בנוי משני חלקים: bases מפורשים (פתח, קמץ, עיצור) +
 * הרחבה אוטומטית פר ניקוד מ-`VOWEL_FILE_INFO` למעלה.
 */
export const TTS_FILES: Record<string, string> = {
	...TTS_FILES_BASE,
	...TTS_FILES_VOWELS
};

/**
 * מחזיר את שם קובץ ה-TTS הסטטי עבור טקסט נתון, או `null` אם לא ממופה.
 * הטקסט מנורמל (`trim` + NFC) לפני החיפוש.
 */
export function getTtsFilename(text: string): string | null {
	const key = text.trim().normalize('NFC');
	return TTS_FILES[key] ?? null;
}

/**
 * האם לצירוף יש הקלטה (MP3) — או שהמשחק ייפול ל-Web Speech.
 * מידע בלבד: צירופים בלי הקלטה אינם נפסלים (ראו `isValidLetterVowel`).
 */
export function hasRecordedSpeech(speak: string): boolean {
	return getTtsFilename(speak) !== null;
}

/**
 * צירוף אות + ניקוד (`LetterVowelPair`) — הפריט שה-Provider מייצר.
 *
 * עקרון:
 *   - `makePair(letter, patah)` מחזיר pair שה-id, display, speak שלו
 *     **זהים בדיוק** ל-LetterCard.id/display/speak הישן של find-letter.
 *     זה שומר על תאימות עם ההגדרות השמורות, PHONETIC_SIMILARITY_PAIRS ו-TTS_FILES.
 *   - `isValidLetterVowel()` — חוקי התקפות של צירוף (משמש את `isValidCombination`).
 *
 * הועבר מ-`apps/find-letter-game/src/lib/utils/pair.ts` (platform-plan שלב 4).
 * מסמך תכנון: apps/find-letter-game/docs/plans/vowels-support-plan.md §3, §7, §9
 */

import type { Letter, LetterGroup } from './letters';
import type { Vowel } from './vowels';

export interface LetterVowelPair {
	/**
	 * id מורכב:
	 *   - patah → letter.legacyCardId (תאימות עם ההגדרות השמורות וה-similarity)
	 *   - אחר  → `${letter.id}__${vowel.code}`
	 */
	id: string;
	letter: Letter;
	vowel: Vowel;
	/** display: letter.legacyDisplayPatah עבור patah, אחרת letter.displayChar + vowel.mark */
	display: string;
	/** speak: letter.legacySpeakPatah עבור patah, אחרת (speakChar ?? char) + vowel.speakSuffix */
	speak: string;
	/** לתאימות עם קוד legacy שמצפה ל-LetterCard */
	group: LetterGroup;
}

/**
 * בונה LetterVowelPair מ-Letter ו-Vowel.
 *
 * עבור patah: משתמש ב-legacySpeakPatah ו-legacyDisplayPatah — ערכים ישנים מדויקים.
 * עבור שאר: בונה דינמית מ-displayChar + suffix.
 */
export function makePair(letter: Letter, vowel: Vowel): LetterVowelPair {
	const id = vowel.code === 'patah' ? letter.legacyCardId : `${letter.id}__${vowel.code}`;

	// עבור patah — משתמש בערכים legacy כדי לשמור תאימות מלאה עם TTS_FILES
	// עבור שאר הניקודים — בונה דינמית מ-speakChar (אם קיים) או char + suffix
	const speakBase = letter.speakChar ?? letter.char;
	const speak = vowel.code === 'patah' ? letter.legacySpeakPatah : speakBase + vowel.speakSuffix;

	const display =
		vowel.code === 'patah' ? letter.legacyDisplayPatah : letter.displayChar + vowel.mark;

	return { id, letter, vowel, display, speak, group: letter.group };
}

/**
 * חוקי התקפות של צירוף אות + ניקוד (vowels-support-plan §9):
 *   - אות סופית (ך, ם, ן, ף, ץ) לא מקבלת שווא או "עיצור" (none).
 *
 * כרגע אין סופיות במאגר, כך שהחוק לא מסנן כלום בפועל — הוא מוכן לפאזת
 * הסופיות. צירופים בלי קובץ MP3 (גרוניות + שווא/עיצור) **אינם** נפסלים:
 * לפי tts-production-plan הם מושמעים ב-Web Speech (קביל), ו-find-letter
 * הציג אותם גם לפני ה-Provider. לבדיקה: `hasRecordedSpeech` ב-`tts-files.ts`.
 */
export function isValidLetterVowel(letter: Letter, vowel: Vowel): boolean {
	return !(letter.isFinalForm && (vowel.code === 'shva' || vowel.code === 'none'));
}

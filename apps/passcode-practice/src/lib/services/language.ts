/**
 * שירות טקסטים — ריכוז המחרוזות שמוצגות למשתמש (ומוקראות ב-TTS).
 * קוד שעבר מיגרציה לקומפוננטות הקיט לוקח את הטקסטים מכאן.
 */

export const language = {
	pageTitle: 'תרגול סיסמא',

	// === Header ===
	homeLabel: 'חזרה לתפריט',
	settingsLabel: 'הגדרות',
	successCountLabel: 'הצלחות:',

	// === משחק ===
	progressLabel: 'לפרס',
	cooldownSecondsLabel: 'שניות להמתנה',

	// === הקראה (TTS) ===
	ttsSuccess: 'כל הכבוד! הסיסמא נכונה!',
	ttsWrong: 'לא נכון, נסה שוב',

	// === מסך הגדרות ===
	settingsPageTitle: 'הגדרות - תרגול סיסמא',
	settingsHeading: '⚙️ הגדרות',
	backLabel: 'חזרה'
} as const;

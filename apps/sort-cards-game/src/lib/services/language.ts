/**
 * שירות טקסטים — ריכוז המחרוזות שמוצגות למשתמש (ומוקראות ב-TTS).
 * קוד שעבר מיגרציה לקומפוננטות הקיט לוקח את הטקסטים מכאן.
 */

export const language = {
	pageTitle: 'משחק מיון כרטיסים',
	pageDescription: 'משחק חינוכי לתרגול מיון כרטיסים לקטגוריות',

	// === Header ===
	homeLabel: 'חזרה לתפריט',
	settingsLabel: 'הגדרות',
	cardsLabel: 'כרטיס:',
	correctLabel: 'נכון:',

	// === מסך פתיחה ===
	gameTitle: '🗂️ מיון כרטיסים',
	startSubtitle: 'גרור את הכרטיסים לארגז הנכון!',
	choosePackLabel: 'בחר נושא:',
	startButton: 'התחל לשחק',

	// === משחק ===
	cooldownMessage: 'המתן...',

	// === הקראה (TTS) ===
	ttsWellDone: 'כל הכבוד!',
	ttsWrong: 'לא נכון, נסה שוב',

	// === מסך הגדרות ===
	settingsPageTitle: 'הגדרות - מיון כרטיסים',
	settingsHeading: '⚙️ הגדרות',
	backLabel: 'חזרה',
	gameModeLabel: 'מצב משחק',
	gameModeManual: 'ידני — כפתור "הבא"',
	gameModeContinuous: 'רציף — מעבר אוטומטי'
} as const;

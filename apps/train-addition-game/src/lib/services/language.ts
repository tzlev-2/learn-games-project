/**
 * שירות טקסטים — ריכוז המחרוזות שמוצגות למשתמש (ומוקראות ב-TTS).
 * קוד שעבר מיגרציה לקומפוננטות הקיט לוקח את הטקסטים מכאן.
 */

export const language = {
	pageTitle: 'משחק רכבת החיבור',
	pageDescription: 'משחק לתרגול חיבור בשיטת המשך רצף',

	// === Header ===
	homeLabel: 'חזרה לתפריט',
	settingsLabel: 'הגדרות',
	roundLabel: 'סיבוב:',
	correctLabel: 'נכון:',

	// === מסך פתיחה ===
	gameTitle: '🚂 רכבת החיבור',
	startSubtitle: 'בנה את הרכבת וגלה כמה קרונות יש!',
	startButton: 'התחל לשחק',

	// === משחק ===
	gamePageTitle: 'רכבת החיבור - משחק',
	cooldownMessage: 'המתן...',
	progressLabel: 'לפרס',

	// === הגדרות ===
	settingsHeading: 'הגדרות',
	backToGame: 'חזרה למשחק',
	choicesCountLabel: 'מספר אפשרויות',

	/**
	 * טקסטים של הנכסים הקוליים — ה-fallback ל-TTS כשההקלטה (static/sounds/<file>.mp3)
	 * לא נטענה. המפתחות תואמים ל-VOICE_FILES ב-utils/tts.ts.
	 */
	voice: {
		num_0: 'אפס',
		num_1: 'אחד',
		num_2: 'שתיים',
		num_3: 'שלוש',
		num_4: 'ארבע',
		num_5: 'חמש',
		num_6: 'שש',
		num_7: 'שבע',
		num_8: 'שמונה',
		num_9: 'תשע',
		num_10: 'עשר',
		num_11: 'אחת עשרה',
		num_12: 'שתים עשרה',
		num_13: 'שלוש עשרה',
		num_14: 'ארבע עשרה',
		num_15: 'חמש עשרה',
		num_16: 'שש עשרה',
		num_17: 'שבע עשרה',
		num_18: 'שמונה עשרה',
		num_19: 'תשע עשרה',
		num_20: 'עשרים',

		plus: 'ועוד',
		equals: 'שווה',

		put_prefix: 'שים',
		add_prefix: 'הוסף עוד',
		cars_suffix: 'קרונות',

		put_1: 'שים קרון אחד',
		put_2: 'שים שני קרונות',
		put_3: 'שים שלושה קרונות',
		put_4: 'שים ארבעה קרונות',
		put_5: 'שים חמישה קרונות',

		add_1: 'הוסף עוד קרון אחד',
		add_2: 'הוסף עוד שני קרונות',
		add_3: 'הוסף עוד שלושה קרונות',
		add_4: 'הוסף עוד ארבעה קרונות',

		how_many: 'כמה קרונות יש עכשיו?',
		correct: 'נכון!',
		well_done: 'כל הכבוד!',
		wrong: 'לא נכון.',
		try_again: 'נסה שוב.',

		how_many_is: 'כמה זה',
		trains_plus: 'רכבות, ועוד'
	}
} as const;

/**
 * מחרוזות UI של הלוטו — מקור יחיד לטקסטים (coding-conventions §1.2).
 * הערה: חלק מהמסכים הישנים עדיין מכילים מחרוזות קשיחות; מחרוזות חדשות נכנסות לכאן.
 */
export const language = {
	game: {
		/** כותרת המשחק — לפי מצב המשחק ושם סוג התוכן */
		title: (mode: 'lotto' | 'memory', providerName: string) =>
			mode === 'memory' ? `משחק זיכרון ${providerName}` : `משחק לוטו ${providerName}`,
		pairsLabel: 'זוגות:',
		roundLabel: 'סבב:',
		attemptsLabel: 'ניסיונות:',
		settingsLabel: 'הגדרות',
		winnerAlt: 'מנצח',
		winnerTitle: 'כל הכבוד!',
		winnerText: 'מצאת את כל הזוגות!',
		rewardButton: 'קבל הפתעה!',
		skipToNextRound: 'דלג והמשך לסבב הבא',
		nextRoundIn: 'הסבב הבא מתחיל בעוד:',
		skipNow: 'דלג והתחל מיד',
		playAgain: 'שחק שוב'
	},
	settingsPage: {
		title: 'הגדרות משחק',
		backToGame: 'חזרה למשחק'
	},
	content: {
		providers: {
			letters: 'אותיות',
			shapes: 'צורות',
			reading: 'ציור של קריאה'
		},
		axes: {
			letters: 'בחירת אותיות',
			shapes: 'בחירת צורות',
			readingItems: 'בחירת אותיות'
		},
		selector: {
			selectAll: 'בחר הכל',
			clearAll: 'נקה הכל',
			reset: 'ברירת מחדל'
		},
		shapes: {
			colorModeTitle: 'מצב צבעים',
			colorModeRandom: 'רנדומלי',
			colorModeUniform: 'אחיד'
		}
	}
} as const;

/**
 * מחרוזות UI של הלוטו — מקור יחיד לטקסטים (coding-conventions §1.2).
 * הערה: חלק מהמסכים הישנים עדיין מכילים מחרוזות קשיחות; מחרוזות חדשות נכנסות לכאן.
 */
export const language = {
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
			clearAll: 'נקה הכל'
		},
		shapes: {
			colorModeTitle: 'מצב צבעים',
			colorModeRandom: 'רנדומלי',
			colorModeUniform: 'אחיד'
		}
	}
} as const;

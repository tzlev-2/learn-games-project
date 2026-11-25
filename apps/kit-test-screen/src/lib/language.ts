export const language = {
	themes: {
		slate: 'Slate (Light)',
		passcode: 'Passcode (Dark)'
	},
	settingsDemo: {
		link: 'דוגמת מסך הגדרות',
		title: 'הגדרות המשחק לדוגמה',
		loading: 'טוען הגדרות...',
		initializationError: 'טעינת ההגדרות נכשלה. רעננו את הדף ונסו שוב.',
		description:
			'בחרו תחום עריכה ושנו שדה. הערכים בפועל ממשיכים לשקף את הפרופיל הפעיל, גם בעריכה כללית.',
		cooldown: 'השהיה אחרי טעות (מילישניות)',
		choices: 'מספר אפשרויות',
		effective: 'הערכים שהמשחק משתמש בהם בפועל',
		cooldownValue: (value: number) => `השהיה: ${value} מילישניות`,
		choicesValue: (value: number) => `אפשרויות: ${value}`,
		error: 'שמירת ההגדרה נכשלה. בדקו את הערך ונסו שוב.'
	}
} as const;

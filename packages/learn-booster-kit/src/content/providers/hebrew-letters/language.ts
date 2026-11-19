/**
 * מחרוזות התוכן "אותיות וניקוד" — מקור יחיד לטקסטים של ה-Provider המשותף.
 *
 * חריג מוצהר לכלל "בלי עברית בקיט": זו חבילת **תוכן** (content package)
 * שהקיט מארח כדי ששני משחקים יצרכו אותה (platform-plan §6.4). המחרוזות
 * מרוכזות כאן, וצרכן יכול להחליף את שמות ה-Provider והצירים דרך
 * `createHebrewLettersProvider({ labels })`. נתוני האותיות עצמם (התווים,
 * שמות האותיות) הם התוכן — הם ב-`letters.ts`, לא כאן.
 */
export const hebrewLettersLanguage = {
	providerName: 'אותיות וניקוד',
	axes: {
		letters: 'אותיות',
		vowels: 'ניקוד'
	},
	vowelNames: {
		patah: 'פתח',
		kamatz: 'קמץ',
		hirik: 'חיריק',
		segol: 'סגול',
		tzere: 'צירה',
		holam: 'חולם',
		shuruk: 'שורוק',
		kubutz: 'קובוץ',
		shva: 'שווא',
		none: 'עיצור'
	}
} as const;

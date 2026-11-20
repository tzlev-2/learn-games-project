/**
 * צמדי דמיון בין אותיות — לבחירת לוח/מסיחים בלי שתי אותיות "דומות".
 *
 * המזהים הם מזהי הפריטים בציר `letters` (legacyCardId), כלומר מזהי
 * הצירוף עם פתח. צירוף עם ניקוד אחר (`b__hirik`) אינו בטבלה — כך
 * התנהג find-letter גם לפני ה-Provider (ראו `areItemsSimilar` ב-provider).
 *
 * רקע: apps/find-letter-game/docs/similar-letters.md
 * הועבר מ-`apps/find-letter-game/src/lib/utils/letters.ts` (platform-plan שלב 4).
 */


export type SimilarityKind = 'visual' | 'phonetic';
export type SimilarityStrength = 'strong' | 'medium';

export interface SimilarityPair {
	a: string;
	b: string;
	kind: SimilarityKind;
	strength: SimilarityStrength;
}

/**
 * צמדים צליליים — נשמעים זהה או כמעט זהה בעברית מודרנית.
 * אלה **הצמדים היחידים** שמשפיעים על `areSimilar()` ועל מנגנון
 * `avoidSimilar` בבחירת הלוח.
 *
 * ראו `docs/similar-letters.md` סעיף 3 ו-§9.1.
 */
export const PHONETIC_SIMILARITY_PAIRS: SimilarityPair[] = [
	// === חזקים — צליל זהה לחלוטין ===
	{ a: 'sa', b: 'sa_sin', kind: 'phonetic', strength: 'strong' },    // ס ↔ שׂ — אותו צליל בעברית מודרנית
	{ a: 'cha_rafe', b: 'cha', kind: 'phonetic', strength: 'strong' }, // כ רפה ↔ ח
	{ a: 'va_rafe', b: 'va', kind: 'phonetic', strength: 'strong' },   // ב רפה ↔ ו
	{ a: 'ta', b: 'tav', kind: 'phonetic', strength: 'strong' },       // ט ↔ ת
	{ a: 'a', b: 'aa', kind: 'phonetic', strength: 'strong' },         // א ↔ ע — שתיהן אלמות
	{ a: 'qa', b: 'ka', kind: 'phonetic', strength: 'strong' },        // ק ↔ כּ — דומות מאוד בעברית מודרנית

	// === בינוניים — דמיון צלילי משמעותי ===
	{ a: 'a', b: 'ha', kind: 'phonetic', strength: 'medium' },         // א ↔ ה — גרוניות שלרוב מבוטאות זהה
	{ a: 'aa', b: 'ha', kind: 'phonetic', strength: 'medium' },        // ע ↔ ה — גרוניות שלרוב מבוטאות זהה
	{ a: 'sa', b: 'za', kind: 'phonetic', strength: 'medium' },        // ס ↔ ז — שיניות (חסרות/קוליות)
	{ a: 'tza', b: 'ta', kind: 'phonetic', strength: 'medium' },       // צ ↔ ט — דומות בהגייה אצל ילדים
];

/**
 * צמדי דמיון צורניים — מתועדים אך **לא** מופעלים בלוגיקת `areSimilar`.
 *
 * החלטה (2026-05-12): הסבב הנוכחי מטפל בדמיון צלילי בלבד.
 * לפרטים ראו docs/similar-letters.md §9.1.
 *
 * כשיגיע הזמן — לאחד עם `PHONETIC_SIMILARITY_PAIRS` או להוסיף פרמטר `kind`.
 */
export const VISUAL_SIMILARITY_PAIRS_FUTURE: SimilarityPair[] = [
	{ a: 'ba', b: 'va_rafe', kind: 'visual', strength: 'strong' },   // בּ ↔ בַ
	{ a: 'ka', b: 'cha_rafe', kind: 'visual', strength: 'strong' },  // כּ ↔ כַ
	{ a: 'pa', b: 'fa_rafe', kind: 'visual', strength: 'strong' },   // פּ ↔ פַ
	{ a: 'da', b: 'ra', kind: 'visual', strength: 'medium' },        // ד ↔ ר
	{ a: 'cha', b: 'ha', kind: 'visual', strength: 'medium' },       // ח ↔ ה
	{ a: 'va', b: 'za', kind: 'visual', strength: 'medium' },        // ו ↔ ז
	{ a: 'ga', b: 'na', kind: 'visual', strength: 'medium' },        // ג ↔ נ
	{ a: 'ya', b: 'va', kind: 'visual', strength: 'medium' },        // י ↔ ו
	{ a: 'sha', b: 'sa_sin', kind: 'visual', strength: 'strong' },   // שׁ ↔ שׂ
	{ a: 'cha', b: 'tav', kind: 'visual', strength: 'strong' },      // ח ↔ ת
	{ a: 'aa', b: 'tza', kind: 'visual', strength: 'strong' },       // ע ↔ צ
	{ a: 'aa', b: 'ta', kind: 'visual', strength: 'medium' },        // ע ↔ ט
	{ a: 'qa', b: 'ha', kind: 'visual', strength: 'medium' },        // ק ↔ ה
];

/**
 * בונה מפת חבר → קבוצת חברים דומים, מבוססת על הצמדים הצליליים בלבד.
 * לדוגמה: similarMap['sa'] = Set{'sa_sin'}.
 */
function buildSimilarityMap(): Map<string, Set<string>> {
	const m = new Map<string, Set<string>>();
	for (const p of PHONETIC_SIMILARITY_PAIRS) { // ← שינוי: רק צלילי
		if (!m.has(p.a)) m.set(p.a, new Set());
		if (!m.has(p.b)) m.set(p.b, new Set());
		m.get(p.a)!.add(p.b);
		m.get(p.b)!.add(p.a);
	}
	return m;
}

const SIMILARITY_MAP = buildSimilarityMap();

/** האם שני כרטיסים נחשבים "דומים" (לפי הצמדים)? */
export function areSimilar(idA: string, idB: string): boolean {
	if (idA === idB) return true;
	return SIMILARITY_MAP.get(idA)?.has(idB) ?? false;
}


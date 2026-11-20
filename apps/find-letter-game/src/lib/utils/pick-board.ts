/**
 * בחירת כרטיסים ללוח — לוגיקת משחק (לא של ה-Provider).
 * functional core: תלוי רק בקלט וב-Math.random.
 *
 * עובר על deck מעורבב ומוסיף פריט רק אם אף נבחר קודם אינו "דומה" לו
 * (`isSimilar` — מה-Provider: `areItemsSimilar`). רקע: docs/similar-letters.md.
 */

export type PickBoardOptions<T> = {
	/** מספר כרטיסים בלוח (לפי גודל הגריד) */
	count: number;
	/** האם לוודא שאין שני פריטים "דומים" באותו לוח */
	avoidSimilar: boolean;
	/** ה-deck מה-Provider — pool מוכן */
	items: readonly T[];
	/** האם שני פריטים דומים. בלעדיו — אין אילוץ דמיון */
	isSimilar?: (a: T, b: T) => boolean;
};

/** מספר ניסיונות מקסימלי לבניית לוח שעומד ב-avoidSimilar */
const PICK_BOARD_MAX_ATTEMPTS = 50;

function shuffled<T>(items: readonly T[]): T[] {
	return [...items].sort(() => Math.random() - 0.5);
}

/** ניסיון בודד לבחירת לוח חמדני */
function pickBoardAttempt<T>(pool: readonly T[], count: number, isSimilar: (a: T, b: T) => boolean): T[] {
	const chosen: T[] = [];
	for (const item of shuffled(pool)) {
		if (chosen.length >= count) break;
		if (!chosen.some((c) => isSimilar(c, item))) chosen.push(item);
	}
	return chosen;
}

/**
 * בחירת כרטיסים ללוח חדש.
 * אם `avoidSimilar=true`, מנסים עד `PICK_BOARD_MAX_ATTEMPTS` פעמים לבחור לוח
 * רנדומלי שעומד באילוץ; אחרת משלימים מהמאגר בלי האילוץ.
 */
export function pickBoard<T extends { id: string }>(opts: PickBoardOptions<T>): T[] {
	const pool = opts.items;
	if (pool.length === 0) return [];

	if (!opts.avoidSimilar || !opts.isSimilar) {
		return shuffled(pool).slice(0, Math.min(opts.count, pool.length));
	}

	const isSimilar = opts.isSimilar;
	let best: T[] = [];
	for (let i = 0; i < PICK_BOARD_MAX_ATTEMPTS; i++) {
		const attempt = pickBoardAttempt(pool, opts.count, isSimilar);
		if (attempt.length === opts.count) return attempt;
		if (attempt.length > best.length) best = attempt;
	}

	// אף ניסיון לא הצליח להגיע ל-count — נשלים מהמאגר בלי האילוץ
	console.warn(
		`[find-letter] avoidSimilar: best attempt got ${best.length}/${opts.count}; filling without constraint.`
	);
	const chosenIds = new Set(best.map((c) => c.id));
	for (const item of shuffled(pool)) {
		if (best.length >= opts.count) break;
		if (chosenIds.has(item.id)) continue;
		best.push(item);
		chosenIds.add(item.id);
	}
	return best;
}

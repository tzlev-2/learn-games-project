/**
 * מיגרציות ההגדרות של "איפה האות?" — functional core (טהור, בלי localStorage).
 *
 * גרסאות (השדה `schemaVersion` בתוך הנתונים):
 *   - v2: `activeGroups` (קבוצות אותיות)
 *   - v3: `selectedLetterIds`
 *   - v4: + `selectedVowels` (כולל חטפים)
 *   - v5: `selectedVowels` בלי חטפים
 *   - v6: ContentProvider רב-צירי של הקיט — `contentProviderId` +
 *         `contentSelections: Record<providerId, ProviderSelection>`.
 *         `selectedLetterIds` → `contentSelections['hebrew-letters'].letters`,
 *         `selectedVowels` → `contentSelections['hebrew-letters'].vowels`.
 *         (אותה צורה כמו בלוטו v3.)
 *
 * המיגרציה רשומה במנוע של הקיט (`registerGameSchema`) — הקיט מריץ אותה בטעינת
 * הפרופיל. היא **אידמפוטנטית** ולא סומכת על גרסת ה-wrapper: נתונים שנשמרו לפני
 * הרישום סומנו ב-wrapper כ-v1 גם כשהם v5, לכן הגרסה נקבעת מהנתונים עצמם.
 */
import { parseSelection, registerGameSchema, type ProviderSelection } from 'learn-booster-kit';
import {
	DEFAULT_LETTER_IDS,
	DEFAULT_VOWEL_CODES,
	HEBREW_LETTERS_PROVIDER_ID,
	LETTERS_AXIS_ID,
	VOWELS_AXIS_ID
} from 'learn-booster-kit/content/hebrew-letters';
import type { FindLetterSettings } from './settings.svelte';

export const FIND_LETTER_SETTINGS_VERSION = 6;

type RawSettings = Record<string, unknown>;

/**
 * טבלת מיפוי סטטית: שם קבוצה → מזהי אותיות.
 * מפורשת כדי שה-migration יהיה דטרמיניסטי גם אם המאגר ישתנה בעתיד.
 */
const GROUP_TO_IDS: Record<string, string[]> = {
	base: ['a', 'ba', 'ga', 'da', 'ha', 'va', 'za', 'cha', 'ta', 'ya', 'ka', 'la', 'ma', 'na', 'sa', 'pa', 'tza', 'qa', 'ra', 'sha', 'tav'],
	confusing: ['sa_sin', 'aa'],
	rafe: ['va_rafe', 'cha_rafe', 'fa_rafe'],
};

/**
 * רשימת VowelCode-ים שהוסרו ושצריך לסנן מ-`selectedVowels` של משתמשים קיימים.
 * תוסיף לכאן כשמסירים עוד ניקודים בעתיד.
 */
const REMOVED_VOWELS = new Set(['hataf-patah', 'hataf-segol']);

/**
 * מסנן ניקודים שהוסרו ממערכת הניקודים מתוך selectedVowels.
 * אם אחרי הסינון לא נשאר כלום — חוזרים ל-['patah'] (ברירת מחדל בטוחה).
 */
function stripRemovedVowels(raw: unknown): string[] {
	if (!Array.isArray(raw)) return ['patah'];
	const filtered = raw.filter(
		(v): v is string => typeof v === 'string' && !REMOVED_VOWELS.has(v),
	);
	return filtered.length > 0 ? filtered : ['patah'];
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * הגדרות ישנות (v2–v5) → v5 (`selectedLetterIds` + `selectedVowels` בלי חטפים).
 * גרסה לא-ידועה או ללא גרסה → `{}`.
 */
export function migrateLegacyToV5(raw: unknown): RawSettings {
	if (!raw || typeof raw !== 'object') return {};
	const r = raw as RawSettings;

	// גרסה 5 — selectedLetterIds + selectedVowels (בלי חטפים) — מחזיר כמו שהוא
	if (r.schemaVersion === 5) {
		return r;
	}

	// גרסה 4 — selectedVowels אולי מכיל חטף-פתח/חטף-סגול → מסנן ומעלה ל-v5
	if (r.schemaVersion === 4) {
		return { ...r, selectedVowels: stripRemovedVowels(r.selectedVowels), schemaVersion: 5 };
	}

	// גרסה 3 — selectedLetterIds ישירות → שדרג ל-v5 עם selectedVowels
	if (r.schemaVersion === 3) {
		return { ...r, selectedVowels: ['patah'], schemaVersion: 5 };
	}

	// גרסה 2 — activeGroups, ממירים ל-selectedLetterIds → שדרג ל-v5
	if (r.schemaVersion === 2 || Array.isArray(r.activeGroups)) {
		const groups: string[] = Array.isArray(r.activeGroups) ? r.activeGroups : ['base'];
		const selectedLetterIds = groups.flatMap((g) => GROUP_TO_IDS[g] ?? []);
		const { activeGroups: _removed, ...rest } = r;
		return { ...rest, selectedLetterIds, selectedVowels: ['patah'], schemaVersion: 5 };
	}

	// גרסה לא-ידועה או ללא גרסה
	return {};
}

/**
 * v5 → v6: הבחירה עוברת ל-`contentSelections` של ה-Provider "אותיות וניקוד".
 * שדה חסר/לא תקין → ברירת המחדל של ה-Provider (כל האותיות / פתח).
 */
export function migrateV5ToV6(v5: RawSettings): RawSettings {
	const { selectedLetterIds, selectedVowels, ...rest } = v5;
	const selection: ProviderSelection = {
		[LETTERS_AXIS_ID]: isStringArray(selectedLetterIds) ? [...selectedLetterIds] : [...DEFAULT_LETTER_IDS],
		[VOWELS_AXIS_ID]: isStringArray(selectedVowels) ? [...selectedVowels] : [...DEFAULT_VOWEL_CODES],
	};
	return {
		...rest,
		schemaVersion: FIND_LETTER_SETTINGS_VERSION,
		contentProviderId: HEBREW_LETTERS_PROVIDER_ID,
		contentSelections: { [HEBREW_LETTERS_PROVIDER_ID]: selection },
	};
}

/**
 * מנקה `contentSelections` של v6: בחירה שלא עוברת `parseSelection` נזרקת
 * (המשחק ייפול לברירת המחדל של ה-Provider).
 */
function sanitizeV6(r: RawSettings): RawSettings {
	const out: RawSettings = { ...r };
	const raw = r.contentSelections;
	const selections: Record<string, ProviderSelection> = {};
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		for (const [providerId, value] of Object.entries(raw)) {
			const parsed = parseSelection(value);
			if (parsed.isOk()) selections[providerId] = parsed.value;
		}
	}
	out.contentSelections = selections;
	if (typeof r.contentProviderId !== 'string') out.contentProviderId = HEBREW_LETTERS_PROVIDER_ID;
	return out;
}

/**
 * ממיר הגדרות גולמיות (מ-localStorage / מהפרופיל) לגרסה הנוכחית (v6).
 * אידמפוטנטית: v6 → v6. גרסה לא-ידועה → `{}` (הקוראים משלימים ברירות מחדל).
 */
export function migrateSettings(raw: unknown): Partial<FindLetterSettings> {
	if (!raw || typeof raw !== 'object') return {};
	const r = raw as RawSettings;
	if (r.schemaVersion === FIND_LETTER_SETTINGS_VERSION) {
		return sanitizeV6(r) as Partial<FindLetterSettings>;
	}
	const v5 = migrateLegacyToV5(r);
	if (Object.keys(v5).length === 0) return {};
	return sanitizeV6(migrateV5ToV6(v5)) as Partial<FindLetterSettings>;
}

/**
 * רישום במנוע המיגרציות של הקיט (סוגר את platform-plan §9.1 "find-letter לא
 * רשום — passthrough"). נקרא פעם אחת בטעינת ה-store, לפני `boosterService.init`.
 */
export function registerFindLetterSettingsSchema(gameId: string): void {
	registerGameSchema(gameId, {
		currentVersion: FIND_LETTER_SETTINGS_VERSION,
		migrate: (data) => migrateSettings(data),
	});
}

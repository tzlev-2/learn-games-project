/**
 * סכמת ההגדרות של הלוטו + מיגרציות — functional core (טהור, בלי localStorage).
 *
 * גרסאות:
 * - v1 (או בלי גרסה): `contentType`, `selectedLetters`, `selectedShapes`, `colorMode`
 * - v2: `contentProviderId` + `contentSettings` שטוח של ה-provider הנוכחי
 *   (`selectedLetters` / `selectedShapes` + `colorMode` / `selectedItems`)
 * - v3: ContentProvider רב-צירי של הקיט — הבחירה נשמרת כ-ProviderSelection
 *   לכל provider (`contentSelections`), וההגדרות שאינן בחירה לכל provider
 *   (`contentSettings`)
 *
 * המיגרציות רשומות במנוע המיגרציות של הקיט (`registerGameSchema`) ורצות דרך
 * `runGameSettingsMigrations` — כך שאותה מיגרציה תעבוד גם אם ההגדרות יעברו
 * בעתיד ל-`profile.gameSettings` של הקיט.
 */
import {
	err,
	ok,
	parseSelection,
	registerGameSchema,
	runGameSettingsMigrations,
	type ProviderSelection,
	type Result,
	type ValidationError
} from 'learn-booster-kit';

export const LOTTO_GAME_ID = 'lotto-game';
export const LOTTO_SETTINGS_VERSION = 3;

export type GameMode = 'lotto' | 'memory';
export type LoopMode = 'finite' | 'infinite';

/** צורת ההגדרות השמורה (v3) */
export interface LottoSettingsData {
	schemaVersion: number;
	gameMode: GameMode;
	pairCount: number;
	contentProviderId: string;
	/** providerId → בחירת המורה (axisId → itemIds) */
	contentSelections: Record<string, ProviderSelection>;
	/** providerId → הגדרות שאינן בחירה (למשל `colorMode` של צורות) */
	contentSettings: Record<string, Record<string, unknown>>;
	loopMode: LoopMode;
	totalRounds: number;
	boosterEnabled: boolean;
	autoBooster: boolean;
	enableDeselect: boolean;
	hideMatchedCards: boolean;
	feedbackDurationSec: number;
	autoNextRound: boolean;
}

export const DEFAULT_SETTINGS: LottoSettingsData = {
	schemaVersion: LOTTO_SETTINGS_VERSION,
	// מצב משחק
	gameMode: 'lotto',
	// הגדרות משחק
	pairCount: 10,
	// הגדרות תוכן - מודולרי
	contentProviderId: 'letters',
	contentSelections: {},
	contentSettings: {},
	// הגדרות לולאה
	loopMode: 'finite',
	totalRounds: 1,
	// הגדרות מחזק
	boosterEnabled: true,
	autoBooster: true,
	// הגדרות משחקיות
	enableDeselect: true,
	hideMatchedCards: false,
	feedbackDurationSec: 2,
	autoNextRound: false
};

// ─── מיגרציות ───────────────────────────────────────────────────────────────

type RawSettings = Record<string, unknown>;

function asRecord(value: unknown): RawSettings {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as RawSettings) : {};
}

function asStringArray(value: unknown): string[] | undefined {
	return Array.isArray(value) && value.every((v) => typeof v === 'string') ? [...value] : undefined;
}

/**
 * v1 → v2 — העתקה של ההמרה שהייתה ב-`SettingsStore.migrateFromV1`.
 * שדות שלא היו ב-v1 (gameMode וכו') לא נוצרים — ברירות המחדל משלימות אותם.
 */
function migrateV1ToV2(data: RawSettings): RawSettings {
	const oldContentType = data.contentType ?? 'letters';
	const isLetters = oldContentType === 'letters';
	const result: RawSettings = {
		pairCount: data.pairCount,
		loopMode: data.loopMode,
		totalRounds: data.totalRounds,
		boosterEnabled: data.boosterEnabled,
		autoBooster: data.autoBooster,
		enableDeselect: data.enableDeselect,
		hideMatchedCards: data.hideMatchedCards,
		contentProviderId: isLetters ? 'letters' : 'shapes',
		contentSettings: isLetters
			? { selectedLetters: data.selectedLetters ?? [] }
			: { selectedShapes: data.selectedShapes ?? [], colorMode: data.colorMode ?? 'random' },
		schemaVersion: 2
	};
	// הסרת undefined כדי שברירות המחדל ישלימו
	return Object.fromEntries(Object.entries(result).filter(([, v]) => v !== undefined));
}

/**
 * מיפוי מפתחות הבחירה של v2 (בתוך contentSettings השטוח) ל-ProviderSelection של v3.
 * המפתח ממופה לפי שמו, בלי קשר ל-provider הנוכחי — כך שגם שאריות של provider
 * קודם שנשארו ב-contentSettings לא הולכות לאיבוד.
 */
const V2_SELECTION_KEYS: Record<string, { providerId: string; axisId: string }> = {
	selectedLetters: { providerId: 'letters', axisId: 'letters' },
	selectedShapes: { providerId: 'shapes', axisId: 'shapes' },
	selectedItems: { providerId: 'reading', axisId: 'readingItems' }
};

/** הגדרות v2 שאינן בחירה → ה-provider שלהן */
const V2_SETTING_KEYS: Record<string, string> = {
	colorMode: 'shapes'
};

/** v2 → v3: פיצול contentSettings השטוח לבחירה + הגדרות per-provider */
function migrateV2ToV3(data: RawSettings): RawSettings {
	const { contentSettings: rawContent, ...rest } = data;
	const flat = asRecord(rawContent);
	const contentSelections: Record<string, ProviderSelection> = {};
	const contentSettings: Record<string, Record<string, unknown>> = {};

	for (const [key, value] of Object.entries(flat)) {
		const selectionTarget = V2_SELECTION_KEYS[key];
		if (selectionTarget) {
			const ids = asStringArray(value);
			if (ids) contentSelections[selectionTarget.providerId] = { [selectionTarget.axisId]: ids };
			continue;
		}
		const settingsProvider = V2_SETTING_KEYS[key];
		if (settingsProvider) {
			contentSettings[settingsProvider] = { ...contentSettings[settingsProvider], [key]: value };
		}
		// מפתחות לא מוכרים נזרקים
	}

	return { ...rest, contentSelections, contentSettings, schemaVersion: 3 };
}

/** צעד מיגרציה אחד: oldVersion → oldVersion + 1 (החוזה של `GameSchemaEntry.migrate`) */
export function migrateLottoSettings(oldData: unknown, oldVersion: number): unknown {
	const data = asRecord(oldData);
	switch (oldVersion) {
		case 1:
			return migrateV1ToV2(data);
		case 2:
			return migrateV2ToV3(data);
		default:
			return data;
	}
}

registerGameSchema(LOTTO_GAME_ID, {
	currentVersion: LOTTO_SETTINGS_VERSION,
	migrate: migrateLottoSettings
});

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ParsedLottoSettings {
	settings: LottoSettingsData;
	/** שדות שנמצאו לא תקינים והוחלפו בברירת מחדל */
	invalidFields: string[];
}

type FieldGuard = (value: unknown) => boolean;

const isNumber: FieldGuard = (v) => typeof v === 'number' && Number.isFinite(v);
const isBoolean: FieldGuard = (v) => typeof v === 'boolean';
const isString: FieldGuard = (v) => typeof v === 'string';

const FIELD_GUARDS: Partial<Record<keyof LottoSettingsData, FieldGuard>> = {
	gameMode: (v) => v === 'lotto' || v === 'memory',
	pairCount: isNumber,
	contentProviderId: isString,
	loopMode: (v) => v === 'finite' || v === 'infinite',
	totalRounds: isNumber,
	boosterEnabled: isBoolean,
	autoBooster: isBoolean,
	enableDeselect: isBoolean,
	hideMatchedCards: isBoolean,
	feedbackDurationSec: isNumber,
	autoNextRound: isBoolean
};

/**
 * אימות הגדרות v3 (אחרי מיגרציה). שדה חסר → ברירת מחדל; שדה לא תקין →
 * ברירת מחדל ונרשם ב-`invalidFields` (לא מוותרים על כל ההגדרות בגלל שדה אחד).
 * הבחירות עוברות דרך `parseSelection` (ArkType) של הקיט.
 * נכשל רק כשהקלט אינו אובייקט.
 */
export function parseLottoSettings(raw: unknown): Result<ParsedLottoSettings, ValidationError> {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		return err({ kind: 'validation', summary: 'lotto settings must be an object' });
	}
	const data = raw as RawSettings;
	const invalidFields: string[] = [];
	const settings: LottoSettingsData = { ...DEFAULT_SETTINGS, contentSelections: {}, contentSettings: {} };
	const target = settings as unknown as RawSettings;

	for (const [field, guard] of Object.entries(FIELD_GUARDS) as [keyof LottoSettingsData, FieldGuard][]) {
		const value = data[field];
		if (value === undefined) continue;
		if (guard(value)) target[field] = value;
		else invalidFields.push(field);
	}

	if (data.contentSelections !== undefined) {
		const selections = asRecord(data.contentSelections);
		for (const [providerId, rawSelection] of Object.entries(selections)) {
			const parsed = parseSelection(rawSelection);
			if (parsed.isOk()) settings.contentSelections[providerId] = parsed.value;
			else invalidFields.push(`contentSelections.${providerId}`);
		}
	}

	if (data.contentSettings !== undefined) {
		for (const [providerId, value] of Object.entries(asRecord(data.contentSettings))) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				settings.contentSettings[providerId] = { ...(value as RawSettings) };
			} else {
				invalidFields.push(`contentSettings.${providerId}`);
			}
		}
	}

	settings.schemaVersion = LOTTO_SETTINGS_VERSION;
	return ok({ settings, invalidFields });
}

/**
 * טעינת הגדרות שמורות מכל גרסה: מיגרציה דרך מנוע הקיט → אימות.
 * `raw` הוא ה-JSON המפוענח מ-localStorage.
 */
export function loadLottoSettings(raw: unknown): Result<ParsedLottoSettings, ValidationError> {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		return err({ kind: 'validation', summary: 'lotto settings must be an object' });
	}
	const version = (raw as RawSettings).schemaVersion;
	const migrated = runGameSettingsMigrations(LOTTO_GAME_ID, {
		schemaVersion: typeof version === 'number' ? version : 1,
		data: raw
	});
	return parseLottoSettings(migrated.data);
}

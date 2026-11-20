/**
 * בדיקות למיגרציות ההגדרות של הלוטו (v1/v2 → v3) ולאימות.
 * המיגרציות רצות דרך מנוע הקיט (`runGameSettingsMigrations`).
 */
import { describe, it, expect } from 'vitest';
import { runGameSettingsMigrations } from 'learn-booster-kit';
import {
	DEFAULT_SETTINGS,
	LOTTO_GAME_ID,
	LOTTO_SETTINGS_VERSION,
	loadLottoSettings,
	migrateLottoSettings,
	parseLottoSettings
} from './settings-schema';

/** הגדרות v2 כפי שנשמרו בפועל ע"י ה-store הקודם (toJSON) */
function v2(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 2,
		gameMode: 'memory',
		pairCount: 6,
		contentProviderId: 'letters',
		contentSettings: { selectedLetters: ['א', 'ב', 'ג'] },
		loopMode: 'infinite',
		totalRounds: 3,
		boosterEnabled: false,
		autoBooster: false,
		enableDeselect: false,
		hideMatchedCards: true,
		feedbackDurationSec: 3.5,
		autoNextRound: true,
		...overrides
	};
}

describe('lotto settings — registration in the kit migration engine', () => {
	it('runGameSettingsMigrations migrates lotto data to v3', () => {
		const result = runGameSettingsMigrations(LOTTO_GAME_ID, { schemaVersion: 2, data: v2() });
		expect(result.schemaVersion).toBe(LOTTO_SETTINGS_VERSION);
		expect((result.data as Record<string, unknown>).schemaVersion).toBe(3);
	});
});

describe('migrateLottoSettings v2 → v3', () => {
	it('letters: selectedLetters → contentSelections.letters.letters', () => {
		const migrated = migrateLottoSettings(v2(), 2) as Record<string, unknown>;
		expect(migrated.contentSelections).toEqual({ letters: { letters: ['א', 'ב', 'ג'] } });
		expect(migrated.contentSettings).toEqual({});
		expect(migrated.schemaVersion).toBe(3);
		expect(migrated).not.toHaveProperty('contentSettings.selectedLetters');
	});

	it('shapes: selectedShapes + colorMode → selection + per-provider settings', () => {
		const migrated = migrateLottoSettings(
			v2({
				contentProviderId: 'shapes',
				contentSettings: { selectedShapes: ['circle', 'star'], colorMode: 'uniform' }
			}),
			2
		) as Record<string, unknown>;
		expect(migrated.contentProviderId).toBe('shapes');
		expect(migrated.contentSelections).toEqual({ shapes: { shapes: ['circle', 'star'] } });
		expect(migrated.contentSettings).toEqual({ shapes: { colorMode: 'uniform' } });
	});

	it('reading: selectedItems → contentSelections.reading.readingItems', () => {
		const migrated = migrateLottoSettings(
			v2({ contentProviderId: 'reading', contentSettings: { selectedItems: ['aleph', 'het'] } }),
			2
		) as Record<string, unknown>;
		expect(migrated.contentSelections).toEqual({ reading: { readingItems: ['aleph', 'het'] } });
	});

	it('keeps leftovers of other providers and drops unknown keys', () => {
		const migrated = migrateLottoSettings(
			v2({ contentSettings: { selectedLetters: ['א'], selectedShapes: ['circle'], junk: 1 } }),
			2
		) as Record<string, unknown>;
		expect(migrated.contentSelections).toEqual({
			letters: { letters: ['א'] },
			shapes: { shapes: ['circle'] }
		});
		expect(migrated.contentSettings).toEqual({});
	});

	it('empty selection stays empty (not replaced by defaults)', () => {
		const migrated = migrateLottoSettings(v2({ contentSettings: { selectedLetters: [] } }), 2) as Record<
			string,
			unknown
		>;
		expect(migrated.contentSelections).toEqual({ letters: { letters: [] } });
	});

	it('missing contentSettings → no saved selection (provider default applies)', () => {
		const { contentSettings: _omit, ...withoutContent } = v2();
		const migrated = migrateLottoSettings(withoutContent, 2) as Record<string, unknown>;
		expect(migrated.contentSelections).toEqual({});
		expect(migrated.contentSettings).toEqual({});
	});

	it('does not mutate its input', () => {
		const input = v2();
		const copy = structuredClone(input);
		migrateLottoSettings(input, 2);
		expect(input).toEqual(copy);
	});
});

describe('migrateLottoSettings v1 → v2 (legacy contentType format)', () => {
	it('letters', () => {
		const migrated = migrateLottoSettings(
			{ contentType: 'letters', selectedLetters: ['ש'], pairCount: 4 },
			1
		) as Record<string, unknown>;
		expect(migrated).toMatchObject({
			schemaVersion: 2,
			contentProviderId: 'letters',
			contentSettings: { selectedLetters: ['ש'] },
			pairCount: 4
		});
	});

	it('shapes with colorMode', () => {
		const migrated = migrateLottoSettings(
			{ contentType: 'shapes', selectedShapes: ['heart'], colorMode: 'uniform' },
			1
		) as Record<string, unknown>;
		expect(migrated).toMatchObject({
			contentProviderId: 'shapes',
			contentSettings: { selectedShapes: ['heart'], colorMode: 'uniform' }
		});
	});
});

describe('loadLottoSettings (migrate + validate)', () => {
	it('v2 letters → full v3 settings, all other fields preserved', () => {
		const result = loadLottoSettings(v2());
		expect(result.isOk()).toBe(true);
		const { settings, invalidFields } = result._unsafeUnwrap();
		expect(invalidFields).toEqual([]);
		expect(settings).toEqual({
			schemaVersion: 3,
			gameMode: 'memory',
			pairCount: 6,
			contentProviderId: 'letters',
			contentSelections: { letters: { letters: ['א', 'ב', 'ג'] } },
			contentSettings: {},
			loopMode: 'infinite',
			totalRounds: 3,
			boosterEnabled: false,
			autoBooster: false,
			enableDeselect: false,
			hideMatchedCards: true,
			feedbackDurationSec: 3.5,
			autoNextRound: true
		});
	});

	it('v1 (no schemaVersion) → v3 through both steps', () => {
		const { settings } = loadLottoSettings({
			contentType: 'shapes',
			selectedShapes: ['circle'],
			colorMode: 'uniform',
			pairCount: 8
		})._unsafeUnwrap();
		expect(settings.contentProviderId).toBe('shapes');
		expect(settings.contentSelections).toEqual({ shapes: { shapes: ['circle'] } });
		expect(settings.contentSettings).toEqual({ shapes: { colorMode: 'uniform' } });
		expect(settings.pairCount).toBe(8);
		// שדות שלא היו ב-v1 מקבלים ברירת מחדל
		expect(settings.gameMode).toBe(DEFAULT_SETTINGS.gameMode);
		expect(settings.feedbackDurationSec).toBe(DEFAULT_SETTINGS.feedbackDurationSec);
	});

	it('schemaVersion 0 is treated as v1', () => {
		const { settings } = loadLottoSettings({
			schemaVersion: 0,
			contentType: 'letters',
			selectedLetters: ['א']
		})._unsafeUnwrap();
		expect(settings.contentSelections).toEqual({ letters: { letters: ['א'] } });
	});

	it('v3 passes through unchanged', () => {
		const v3 = { ...DEFAULT_SETTINGS, contentSelections: { reading: { readingItems: ['bet'] } } };
		const { settings } = loadLottoSettings(v3)._unsafeUnwrap();
		expect(settings).toEqual(v3);
	});

	it('round-trip: loaded v3 settings load again to the same value', () => {
		const first = loadLottoSettings(v2())._unsafeUnwrap().settings;
		const second = loadLottoSettings(JSON.parse(JSON.stringify(first)))._unsafeUnwrap().settings;
		expect(second).toEqual(first);
	});

	it('invalid fields fall back to defaults and are reported', () => {
		const { settings, invalidFields } = loadLottoSettings({
			...DEFAULT_SETTINGS,
			pairCount: 'ten',
			gameMode: 'puzzle',
			contentSelections: { letters: { letters: [1, 2] }, shapes: { shapes: ['circle'] } },
			contentSettings: { shapes: 'oops' }
		})._unsafeUnwrap();
		expect(settings.pairCount).toBe(DEFAULT_SETTINGS.pairCount);
		expect(settings.gameMode).toBe(DEFAULT_SETTINGS.gameMode);
		expect(settings.contentSelections).toEqual({ shapes: { shapes: ['circle'] } });
		expect(settings.contentSettings).toEqual({});
		expect(invalidFields.sort()).toEqual(
			['contentSelections.letters', 'contentSettings.shapes', 'gameMode', 'pairCount'].sort()
		);
	});

	it.each([null, 'string', 42, ['array']])('non-object input → err: %s', (raw) => {
		expect(loadLottoSettings(raw).isErr()).toBe(true);
		expect(parseLottoSettings(raw).isErr()).toBe(true);
	});
});

describe('hebrew-letters — the shared "letters with vowels" provider (platform-plan phase 4)', () => {
	it('v3 settings with hebrew-letters load unchanged — no migration needed', () => {
		const saved = {
			...DEFAULT_SETTINGS,
			contentProviderId: 'hebrew-letters',
			contentSelections: {
				letters: { letters: ['א', 'ב'] },
				'hebrew-letters': { letters: ['ba', 'ga'], vowels: ['patah', 'hirik'] }
			}
		};
		const result = loadLottoSettings(saved)._unsafeUnwrap();
		expect(result.invalidFields).toEqual([]);
		expect(result.settings.contentProviderId).toBe('hebrew-letters');
		expect(result.settings.contentSelections).toEqual(saved.contentSelections);
	});

	it('existing v2 letters settings still migrate to the lotto letters provider', () => {
		const result = loadLottoSettings({
			schemaVersion: 2,
			contentProviderId: 'letters',
			contentSettings: { selectedLetters: ['ג'] }
		})._unsafeUnwrap();
		expect(result.settings.contentProviderId).toBe('letters');
		expect(result.settings.contentSelections).toEqual({ letters: { letters: ['ג'] } });
	});
});


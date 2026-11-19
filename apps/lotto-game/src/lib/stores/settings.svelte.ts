import { browser } from '$app/environment';
import type { ProviderSelection } from 'learn-booster-kit';
import { lottoContent } from '$lib/content';
import {
	DEFAULT_SETTINGS,
	LOTTO_SETTINGS_VERSION,
	loadLottoSettings,
	type GameMode,
	type LoopMode,
	type LottoSettingsData
} from './settings-schema';

const STORAGE_KEY = 'lotto-game-settings';

export { DEFAULT_SETTINGS };
export type LottoSettings = LottoSettingsData;

class SettingsStore {
	gameMode = $state<GameMode>(DEFAULT_SETTINGS.gameMode);
	pairCount = $state(DEFAULT_SETTINGS.pairCount);
	contentProviderId = $state(DEFAULT_SETTINGS.contentProviderId);
	/** providerId → בחירת המורה (ProviderSelection) */
	contentSelections = $state<Record<string, ProviderSelection>>({});
	/** providerId → הגדרות שאינן בחירה */
	contentSettings = $state<Record<string, Record<string, unknown>>>({});
	loopMode = $state<LoopMode>(DEFAULT_SETTINGS.loopMode);
	totalRounds = $state(DEFAULT_SETTINGS.totalRounds);
	boosterEnabled = $state(DEFAULT_SETTINGS.boosterEnabled);
	autoBooster = $state(DEFAULT_SETTINGS.autoBooster);
	enableDeselect = $state(DEFAULT_SETTINGS.enableDeselect);
	hideMatchedCards = $state(DEFAULT_SETTINGS.hideMatchedCards);
	feedbackDurationSec = $state(DEFAULT_SETTINGS.feedbackDurationSec);
	autoNextRound = $state(DEFAULT_SETTINGS.autoNextRound);

	constructor() {
		if (browser) {
			this.load();
		}

		$effect.root(() => {
			$effect(() => {
				this.toJSON(); // Track dependencies
				this.save();
			});
		});
	}

	/** ה-provider הנוכחי (id לא מוכר → ברירת המחדל של המשחק) */
	get currentProvider() {
		return lottoContent.getProvider(this.contentProviderId);
	}

	/**
	 * שליפת ההגדרות הספציפיות ל-provider הנוכחי (ברירות מחדל + שמורות)
	 */
	getCurrentProviderSettings<T = unknown>(): T {
		const provider = this.currentProvider;
		const defaults = (provider.getDefaultSettings?.() ?? {}) as Record<string, unknown>;
		return { ...defaults, ...this.contentSettings[provider.id] } as T;
	}

	/**
	 * שליפת בחירת המורה ל-provider הנוכחי (שמורה, או ברירת המחדל של ה-provider)
	 */
	getCurrentSelection(): ProviderSelection {
		const provider = this.currentProvider;
		return this.contentSelections[provider.id] ?? provider.getDefaultSelection();
	}

	/**
	 * עדכון הגדרות ה-provider הנוכחי (מיזוג)
	 */
	updateProviderSettings(partial: Record<string, unknown>) {
		const providerId = this.currentProvider.id;
		this.contentSettings = {
			...this.contentSettings,
			[providerId]: { ...this.contentSettings[providerId], ...partial }
		};
	}

	/**
	 * עדכון בחירת המורה ל-provider הנוכחי
	 */
	updateSelection(selection: ProviderSelection) {
		this.contentSelections = { ...this.contentSelections, [this.currentProvider.id]: selection };
	}

	/**
	 * החלפת provider — הבחירה וההגדרות של כל provider נשמרות בנפרד
	 */
	setProvider(providerId: string) {
		this.contentProviderId = lottoContent.resolveProviderId(providerId);
	}

	private load() {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return;

		let raw: unknown;
		try {
			raw = JSON.parse(saved);
		} catch (e) {
			console.error('Failed to parse settings', e);
			return;
		}

		const result = loadLottoSettings(raw);
		if (result.isErr()) {
			console.error('Invalid lotto settings, using defaults:', result.error.summary);
			return;
		}
		const { settings: data, invalidFields } = result.value;
		if (invalidFields.length > 0) {
			console.warn('Invalid lotto settings fields replaced with defaults:', invalidFields);
		}
		this.apply(data);
	}

	private apply(data: LottoSettingsData) {
		this.gameMode = data.gameMode;
		this.pairCount = data.pairCount;
		this.contentProviderId = lottoContent.resolveProviderId(data.contentProviderId);
		this.contentSelections = data.contentSelections;
		this.contentSettings = data.contentSettings;
		this.loopMode = data.loopMode;
		this.totalRounds = data.totalRounds;
		this.boosterEnabled = data.boosterEnabled;
		this.autoBooster = data.autoBooster;
		this.enableDeselect = data.enableDeselect;
		this.hideMatchedCards = data.hideMatchedCards;
		this.feedbackDurationSec = data.feedbackDurationSec;
		this.autoNextRound = data.autoNextRound;
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
	}

	toJSON(): LottoSettingsData {
		return {
			schemaVersion: LOTTO_SETTINGS_VERSION,
			gameMode: this.gameMode,
			pairCount: this.pairCount,
			contentProviderId: this.contentProviderId,
			contentSelections: this.contentSelections,
			contentSettings: this.contentSettings,
			loopMode: this.loopMode,
			totalRounds: this.totalRounds,
			boosterEnabled: this.boosterEnabled,
			autoBooster: this.autoBooster,
			enableDeselect: this.enableDeselect,
			hideMatchedCards: this.hideMatchedCards,
			feedbackDurationSec: this.feedbackDurationSec,
			autoNextRound: this.autoNextRound
		};
	}

	reset() {
		// כמו קודם: ה-provider הנוכחי נשמר, הבחירה וההגדרות שלו חוזרות לברירת מחדל
		this.apply({
			...DEFAULT_SETTINGS,
			contentProviderId: this.contentProviderId,
			contentSelections: {},
			contentSettings: {}
		});
	}
}

export const settings = new SettingsStore();

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { get } from 'svelte/store';
import SettingsDemo from '../../../apps/kit-test-screen/src/routes/showcase/settings/_components/SettingsDemo.svelte';
import * as profiles from '../src/lib/config/profile-manager';
import * as configManager from '../src/lib/config/config-manager';
import { getDefaultBoosterConfig } from '../src/lib/config/default-config';
import { language } from '../../../apps/kit-test-screen/src/lib/language';

const boot = vi.hoisted(() => ({ initialize: vi.fn() }));
vi.mock('../../../apps/kit-test-screen/src/lib/booster-init', () => ({
	initializeBooster: boot.initialize
}));
vi.mock('../src/lib/fully-kiosk/get-app-list', () => ({ getAppsList: async () => [] }));

let instance: ReturnType<typeof mount> | undefined;
const config = { ...structuredClone(getDefaultBoosterConfig()), rewardType: 'site' as const };

function render() {
	const target = document.createElement('div');
	document.body.append(target);
	instance = mount(SettingsDemo, { target, props: { onBack: () => {} } });
	flushSync();
}

async function settle() {
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 0));
	flushSync();
}

beforeEach(async () => {
	localStorage.clear();
	profiles._resetProfilesStateForTesting();
	profiles.hydrateProfiles(config);
	await configManager.updateConfig(structuredClone(config));
	boot.initialize.mockReset();
});

afterEach(async () => {
	if (instance) await unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
});

describe('settings demo initialization', () => {
	it('waits for delayed initialization, preserves stored config, and saves edits after loading', async () => {
		let complete!: () => void;
		const pending = new Promise<void>((resolve) => {
			complete = resolve;
		});
		boot.initialize.mockReturnValue(pending);
		profiles.updateProfile(profiles.getProfilesState().activeProfileId!, {
			boosterConfig: { ...structuredClone(config), turnsPerReward: 9 }
		});
		expect(get(configManager.configStore).turnsPerReward).toBe(1);

		render();
		expect(document.querySelector('.game-settings-page')).toBeNull();
		expect(document.body.textContent).toContain(language.settingsDemo.loading);
		await new Promise((resolve) => setTimeout(resolve, 1100));
		expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(9);
		expect(document.querySelector('#turnsPerVideo')).toBeNull();

		await configManager.updateConfig({ turnsPerReward: 9 });
		complete();
		await settle();
		expect(document.querySelector<HTMLInputElement>('#turnsPerVideo')?.value).toBe('9');
		const input = document.querySelector<HTMLInputElement>('#turnsPerVideo')!;
		input.value = '6';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		flushSync();
		await vi.waitFor(
			() => {
				expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(6);
			},
			{ timeout: 2000 }
		);

		await unmount(instance!);
		instance = undefined;
		document.body.innerHTML = '';
		render();
		await settle();
		expect(document.querySelector<HTMLInputElement>('#turnsPerVideo')?.value).toBe('6');
		expect(get(configManager.configStore).turnsPerReward).toBe(6);
	});

	it('keeps the form absent and shows a loading error when initialization fails', async () => {
		boot.initialize.mockRejectedValue(new Error('Initialization failed'));
		render();
		await settle();
		expect(document.querySelector('.game-settings-page')).toBeNull();
		expect(document.querySelector('[role="alert"]')?.textContent).toBe(
			language.settingsDemo.initializationError
		);
	});
});

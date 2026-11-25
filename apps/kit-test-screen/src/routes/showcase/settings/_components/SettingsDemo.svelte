<script lang="ts">
	import SettingsDemoFields from './SettingsDemoFields.svelte';
	import { onMount } from 'svelte';
	import { type } from 'arktype';
	import {
		GameSettingsPage,
		boosterService,
		configStore,
		defineGameSettings,
		type GameSettingsScope
	} from 'learn-booster-kit';
	import { language } from '../../../../lib/language';
	import { initializeBooster } from '../../../../lib/booster-init';

	let { onBack }: { onBack: () => void } = $props();

	const schema = type({
		cooldownMs: 'number >= 0',
		choices: '1 <= number <= 12'
	});
	const settings = defineGameSettings({
		gameId: 'kit-settings-demo',
		defaults: { cooldownMs: 3000, choices: 4 },
		schema,
		currentVersion: 1,
		migrate: (data) => data
	});
	const text = language.settingsDemo;
	let effective = $state(settings.get());
	let general = $state(settings.getGeneral());
	let ready = $state(false);
	let initializationError = $state(false);

	onMount(() => {
		let mounted = true;
		const unsubscribe = settings.subscribe((next) => {
			effective = next;
			general = settings.getGeneral();
		});
		async function initialize() {
			try {
				await initializeBooster();
				if (mounted) ready = true;
			} catch {
				if (mounted) initializationError = true;
			}
		}
		void initialize();
		return () => {
			mounted = false;
			unsubscribe();
		};
	});
</script>

{#if initializationError}
	<p class="initialization-message" role="alert">
		{text.initializationError}
	</p>
{:else if !ready}
	<p class="initialization-message" role="status">{text.loading}</p>
{:else}
	<GameSettingsPage
		title={text.title}
		{onBack}
		{settings}
		config={$configStore}
		handleShowVideo={(config) => void boosterService.triggerReward(undefined, config)}
	>
		{#snippet gameSection(scope: GameSettingsScope)}
			<p class="demo-description">{text.description}</p>
			<SettingsDemoFields {settings} {scope} {general} {effective} />
			<aside aria-live="polite">
				<h3>{text.effective}</h3>
				<p>
					{text.cooldownValue(effective.cooldownMs)} · {text.choicesValue(effective.choices)}
				</p>
			</aside>
		{/snippet}
	</GameSettingsPage>
{/if}

<style>
	.initialization-message {
		padding: 1.5rem;
		text-align: center;
		direction: rtl;
	}
	.demo-description {
		margin-block-end: 0.75rem;
		font-size: 0.875rem;
		color: var(--theme-panel-text-muted);
	}
	aside {
		padding: 0.75rem;
		background: var(--theme-panel-card-bg);
		border: 1px solid var(--theme-panel-card-border);
		color: var(--theme-panel-text);
		margin-block-start: 0.75rem;
		border-radius: 0.5rem;
	}
	h3 {
		font-weight: 700;
		margin-block-end: 0.25rem;
	}
	[role='alert'] {
		color: var(--theme-panel-text);
	}
</style>

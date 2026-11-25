<script lang="ts">
	import { onMount } from 'svelte';
	import { type } from 'arktype';
	import {
		GameSettingsPage,
		OverriddenMark,
		boosterService,
		configStore,
		defineGameSettings,
		type GameSettingsScope
	} from 'learn-booster-kit';
	import { language } from '../../../../lib/language';
	import { initializeBooster } from '../../../../lib/booster-init';

	let { onBack }: { onBack: () => void } = $props();

	const schema = type({ cooldownMs: 'number >= 0', choices: '1 <= number <= 12' });
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
	let saveError = $state(false);
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

	function update(key: 'cooldownMs' | 'choices', value: number, scope: GameSettingsScope) {
		saveError = settings.set({ [key]: value }, scope).isErr();
	}
</script>

{#if initializationError}
	<p class="initialization-message" role="alert">{text.initializationError}</p>
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
			<p>{text.description}</p>
			<div class="fields">
				<OverriddenMark key="cooldownMs" {settings}>
					<label for="demo-cooldown">{text.cooldown}</label>
					<input
						id="demo-cooldown"
						type="number"
						min="0"
						step="500"
						value={scope === 'general' ? general.cooldownMs : effective.cooldownMs}
						onchange={(event) => update('cooldownMs', event.currentTarget.valueAsNumber, scope)}
					/>
				</OverriddenMark>
				<OverriddenMark key="choices" {settings}>
					<label for="demo-choices">{text.choices}</label>
					<input
						id="demo-choices"
						type="number"
						min="1"
						max="12"
						value={scope === 'general' ? general.choices : effective.choices}
						onchange={(event) => update('choices', event.currentTarget.valueAsNumber, scope)}
					/>
				</OverriddenMark>
			</div>
			{#if saveError}<p role="alert">{text.error}</p>{/if}
			<aside aria-live="polite">
				<h3>{text.effective}</h3>
				<p>{text.cooldownValue(effective.cooldownMs)} · {text.choicesValue(effective.choices)}</p>
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
	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-block: 1rem;
	}
	label {
		display: block;
		margin-block-end: 0.5rem;
	}
	input {
		width: 100%;
		min-height: 48px;
		padding: 0.5rem;
		border: 1px solid var(--theme-border-subtle, #cbd5e1);
		border-radius: 0.5rem;
	}
	aside {
		padding: 0.75rem;
		background: var(--theme-surface-sunken, #f1f5f9);
		border-radius: 0.5rem;
	}
	h3 {
		font-weight: 700;
		margin-block-end: 0.25rem;
	}
	[role='alert'] {
		color: var(--theme-feedback-error, #b91c1c);
	}
</style>

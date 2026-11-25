<script lang="ts">
	import { SettingRow, type GameSettingsHandle, type GameSettingsScope } from 'learn-booster-kit';
	import { useGameSettingsSaveStatus } from 'learn-booster-kit/ui/components/GameSettingsPage.svelte';
	import { language } from '../../../../lib/language';

	interface DemoSettings {
		cooldownMs: number;
		choices: number;
	}
	let {
		settings,
		scope,
		general,
		effective
	}: {
		settings: GameSettingsHandle<DemoSettings>;
		scope: GameSettingsScope;
		general: DemoSettings;
		effective: DemoSettings;
	} = $props();
	const text = language.settingsDemo;
	const reportSave = useGameSettingsSaveStatus();
	let saveError = $state(false);

	function update(key: keyof DemoSettings, value: number) {
		saveError = reportSave(settings.set({ [key]: value }, scope)).isErr();
	}
</script>

<div class="fields">
	<SettingRow label={text.cooldown} key="cooldownMs" {settings} wide>
		{#snippet control()}
			<input
				id="demo-cooldown"
				aria-label={text.cooldown}
				type="number"
				min="0"
				step="500"
				value={scope === 'general' ? general.cooldownMs : effective.cooldownMs}
				onchange={(event) => update('cooldownMs', event.currentTarget.valueAsNumber)}
			/>
		{/snippet}
	</SettingRow>
	<SettingRow label={text.choices} key="choices" {settings} wide>
		{#snippet control()}
			<input
				id="demo-choices"
				aria-label={text.choices}
				type="number"
				min="1"
				max="12"
				value={scope === 'general' ? general.choices : effective.choices}
				onchange={(event) => update('choices', event.currentTarget.valueAsNumber)}
			/>
		{/snippet}
	</SettingRow>
</div>
{#if saveError}<p role="alert">{text.error}</p>{/if}

<style>
	.fields {
		display: grid;
		gap: 0.75rem;
	}
	input {
		width: 100%;
		min-height: 48px;
		padding: 0.5rem;
		border: 1px solid var(--theme-panel-card-border);
		background: var(--theme-panel-field-bg);
		color: var(--theme-panel-field-text);
		font-size: 1rem;
		border-radius: 0.5rem;
	}
	[role='alert'] {
		color: var(--theme-panel-text);
	}
</style>

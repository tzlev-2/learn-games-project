<script lang="ts">
  import { onMount } from "svelte";
  import { SettingRow, type GameSettingsScope } from "learn-booster-kit";
  import { useGameSettingsSaveStatus } from "learn-booster-kit/ui/components/GameSettingsPage.svelte";
  import { settings, settingsHandle } from "$lib/stores/settings.svelte";
  import { language } from "$lib/services/language";
  import PasscodeField from "./PasscodeField.svelte";
  import type { PasscodeSettings } from "$lib/stores/settings-schema";

  let { scope }: { scope: GameSettingsScope } = $props();
  const text = language.gameSettings;
  const reportSave = useGameSettingsSaveStatus();
  let effective = $state(settingsHandle.get());
  let general = $state(settingsHandle.getGeneral());
  let saveError = $state(false);
  const values = $derived(scope === "general" ? general : effective);
  const toggles = [
    {
      key: "showHint",
      label: text.showHint,
      description: text.showHintDescription,
    },
    {
      key: "voiceEnabled",
      label: text.voiceEnabled,
      description: text.voiceDescription,
    },
    {
      key: "speakDigits",
      label: text.speakDigits,
      description: text.speakDigitsDescription,
    },
    {
      key: "boosterEnabled",
      label: text.boosterEnabled,
      description: text.boosterDescription,
    },
  ] as const;
  const durations = [
    {
      key: "cooldownMs",
      id: "cooldown-range",
      label: text.cooldown,
      description: text.cooldownDescription,
      kind: "range",
      min: 0.5,
      max: 8,
      step: 0.5,
    },
    {
      key: "hintVisibleMs",
      id: "hint-visible-input",
      label: text.hintVisible,
      description: text.hintVisibleDescription,
      kind: "number",
      min: 1,
      max: undefined,
      step: 1,
    },
    {
      key: "hintCooldownMs",
      id: "hint-cooldown-input",
      label: text.hintCooldown,
      description: text.hintCooldownDescription,
      kind: "number",
      min: 1,
      max: undefined,
      step: 1,
    },
  ] as const;

  onMount(() =>
    settingsHandle.subscribe((next) => {
      effective = next;
      general = settingsHandle.getGeneral();
    }),
  );

  function update(patch: Partial<PasscodeSettings>) {
    saveError = reportSave(settingsHandle.set(patch, scope)).isErr();
  }

  function reset() {
    saveError = reportSave(settings.reset(scope)).isErr();
  }
</script>

<div class="fields">
  <SettingRow
    label={text.passcode}
    description={text.passcodeDescription}
    key="passcode"
    settings={settingsHandle}
    wide
  >
    {#snippet control()}
      <PasscodeField
        value={values.passcode}
        onChange={(passcode) => update({ passcode })}
      />
    {/snippet}
  </SettingRow>
  {#each toggles as field (field.key)}
    <SettingRow
      label={field.label}
      description={field.description}
      key={field.key}
      settings={settingsHandle}
    >
      {#snippet control()}
        <input
          id={`passcode-${field.key}`}
          type="checkbox"
          aria-label={field.label}
          checked={values[field.key]}
          onchange={(event) =>
            update({ [field.key]: event.currentTarget.checked })}
        />
      {/snippet}
    </SettingRow>
  {/each}
  {#each durations as field (field.key)}
    <SettingRow
      label={`${field.label}: ${text.seconds(values[field.key] / 1000)}`}
      description={field.description}
      key={field.key}
      settings={settingsHandle}
      wide
    >
      {#snippet control()}
        <input
          id={field.id}
          aria-label={field.label}
          type={field.kind}
          min={field.min}
          max={field.max}
          step={field.step}
          value={values[field.key] / 1000}
          onchange={(event) => {
            const seconds = event.currentTarget.valueAsNumber;
            if (Number.isFinite(seconds) && seconds >= field.min)
              update({ [field.key]: seconds * 1000 });
          }}
        />
      {/snippet}
    </SettingRow>
  {/each}
</div>
{#if saveError}<p role="alert">{text.saveError}</p>{/if}
<button type="button" class="reset" onclick={reset}>{text.reset}</button>

<style>
  .fields {
    display: grid;
    gap: 0.75rem;
  }
  input {
    accent-color: var(--theme-brand-primary, #4f46e5);
  }
  input:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--theme-brand-primary);
    outline-offset: 2px;
  }
  input[type="checkbox"] {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
  }
  input[type="number"],
  input[type="range"] {
    width: 100%;
    min-height: 48px;
  }
  input[type="number"] {
    padding: 0.5rem;
    border: 1px solid var(--theme-panel-card-border);
    border-radius: 0.5rem;
    background: var(--theme-panel-field-bg);
    color: var(--theme-panel-field-text);
    font-size: 1rem;
  }
  .reset {
    min-height: 48px;
    padding: 0.75rem 1rem;
    margin-block-start: 1rem;
    border: 1px solid var(--theme-panel-card-border);
    background: var(--theme-panel-card-bg);
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--theme-panel-text);
  }
  [role="alert"] {
    color: var(--theme-panel-text);
  }
</style>

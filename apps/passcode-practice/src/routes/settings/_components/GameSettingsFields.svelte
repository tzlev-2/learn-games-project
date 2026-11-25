<script lang="ts">
  import { onMount } from "svelte";
  import { OverriddenMark, type GameSettingsScope } from "learn-booster-kit";
  import { settings, settingsHandle } from "$lib/stores/settings.svelte";
  import { language } from "$lib/services/language";
  import PasscodeField from "./PasscodeField.svelte";
  import type { PasscodeSettings } from "$lib/stores/settings-schema";

  let { scope }: { scope: GameSettingsScope } = $props();
  const text = language.gameSettings;
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
    saveError = settingsHandle.set(patch, scope).isErr();
  }

  function reset() {
    saveError = settings.reset(scope).isErr();
  }
</script>

<div class="fields">
  <OverriddenMark key="passcode" settings={settingsHandle}>
    <PasscodeField
      value={values.passcode}
      onChange={(passcode) => update({ passcode })}
    />
  </OverriddenMark>
  {#each toggles as field (field.key)}
    <OverriddenMark key={field.key} settings={settingsHandle}>
      <label class="toggle" for={`passcode-${field.key}`}>
        <span>
          <strong>{field.label}</strong>
          <span class="description">{field.description}</span>
        </span>
        <input
          id={`passcode-${field.key}`}
          type="checkbox"
          checked={values[field.key]}
          onchange={(event) =>
            update({ [field.key]: event.currentTarget.checked })}
        />
      </label>
    </OverriddenMark>
  {/each}
  {#each durations as field (field.key)}
    <OverriddenMark key={field.key} settings={settingsHandle}>
      <label for={field.id}>
        <strong>{field.label}: {text.seconds(values[field.key] / 1000)}</strong>
        <span class="description">{field.description}</span>
      </label>
      <input
        id={field.id}
        type={field.kind}
        min={field.min}
        max={field.max}
        step={field.step}
        value={values[field.key] / 1000}
        onchange={(event) => {
          const seconds = event.currentTarget.valueAsNumber;
          if (Number.isFinite(seconds) && seconds >= field.min) {
            update({ [field.key]: seconds * 1000 });
          }
        }}
      />
    </OverriddenMark>
  {/each}
</div>
{#if saveError}<p role="alert">{text.saveError}</p>{/if}
<button type="button" class="reset" onclick={reset}>{text.reset}</button>

<style>
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: 0.75rem;
  }
  label {
    display: block;
  }
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 48px;
    cursor: pointer;
  }
  .description {
    display: block;
    margin-block: 0.5rem;
    font-size: 0.875rem;
    color: var(--theme-text-secondary, #475569);
  }
  input {
    accent-color: var(--theme-brand-primary, #2563eb);
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
    border: 1px solid var(--theme-border-subtle, #cbd5e1);
    border-radius: 0.5rem;
    background: var(--theme-surface-elevated, white);
    color: inherit;
  }
  .reset {
    min-height: 48px;
    padding: 0.75rem 1rem;
    margin-block-start: 1rem;
    border: 1px solid var(--theme-feedback-error, #b91c1c);
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--theme-feedback-error, #b91c1c);
  }
  [role="alert"] {
    color: var(--theme-feedback-error, #b91c1c);
  }
</style>

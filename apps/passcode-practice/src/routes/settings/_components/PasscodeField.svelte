<script lang="ts">
  import { EyeIcon, EyeOffIcon } from "learn-booster-kit";
  import { language } from "$lib/services/language";

  interface Props {
    value: string;
    onChange: (value: string) => void;
  }

  let { value, onChange }: Props = $props();
  let showPasscode = $state(false);
  const text = language.gameSettings;
  const valid = $derived(/^\d+$/.test(value) && value.length >= 1);
</script>

<div class="passcode-field">
  <div class="editor">
    <input
      id="passcode-input"
      aria-label={text.passcode}
      type={showPasscode ? "text" : "password"}
      {value}
      oninput={(event) => {
        const cleaned = event.currentTarget.value.replace(/\D/g, "");
        event.currentTarget.value = cleaned;
        onChange(cleaned);
      }}
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="8"
      dir="ltr"
      placeholder="1234"
      aria-invalid={!valid}
      aria-describedby="passcode-description"
    />
    <button
      type="button"
      onclick={() => (showPasscode = !showPasscode)}
      aria-label={showPasscode ? text.hidePasscode : text.showPasscode}
      aria-pressed={showPasscode}
    >
      {#if showPasscode}
        <EyeOffIcon />
      {:else}
        <EyeIcon />
      {/if}
    </button>
  </div>
  {#if !valid}<p role="alert">{text.invalidPasscode}</p>{/if}
  <p id="passcode-description">{text.passcodeLength(value.length)}</p>
</div>

<style>
  p {
    margin-block: 0.5rem;
    font-size: 0.875rem;
    color: var(--theme-panel-text-muted);
  }
  .editor {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  input {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding: 0.5rem;
    border: 1px solid var(--theme-panel-card-border);
    border-radius: 0.5rem;
    background: var(--theme-panel-field-bg);
    color: var(--theme-panel-field-text);
    font-size: 1rem;
    text-align: center;
    letter-spacing: 0.2em;
  }
  input::placeholder {
    color: var(--theme-panel-text-muted);
    opacity: 1;
  }
  button {
    display: grid;
    place-items: center;
    min-width: 48px;
    min-height: 48px;
    border: 1px solid var(--theme-panel-card-border);
    border-radius: 0.5rem;
    background: var(--theme-panel-field-bg);
    color: var(--theme-panel-field-text);
    cursor: pointer;
  }
  [role="alert"] {
    color: var(--theme-panel-text);
  }
</style>

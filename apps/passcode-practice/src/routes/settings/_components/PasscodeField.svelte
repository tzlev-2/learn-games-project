<script lang="ts">
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
      {showPasscode ? "🙈" : "👁️"}
    </button>
  </div>
  {#if !valid}<p role="alert">{text.invalidPasscode}</p>{/if}
  <p id="passcode-description">{text.passcodeLength(value.length)}</p>
</div>

<style>
  p {
    margin-block: 0.5rem;
    font-size: 0.875rem;
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
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: #ffffff;
    color: inherit;
    font-size: 1.5rem;
    text-align: center;
    letter-spacing: 0.2em;
  }
  button {
    min-width: 48px;
    min-height: 48px;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  [role="alert"] {
    color: #b91c1c;
  }
</style>

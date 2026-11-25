<script lang="ts" generics="T extends object">
    import type { Snippet } from "svelte";
    import { fromStore } from "svelte/store";
    import type { GameSettingsHandle } from "../../lib/config/game-settings";
    import { language } from "../language";
    import { overrideKeysStore } from "./override-keys-store";

    interface Props {
        key: keyof T;
        settings: GameSettingsHandle<T>;
        children: Snippet;
    }

    let { key, settings, children }: Props = $props();
    const overrides = $derived(fromStore(overrideKeysStore(settings)));
    let resetError = $state(false);
    const overridden = $derived(overrides.current.includes(key));

    function clear() {
        resetError = settings.clearOverride(key).isErr();
    }
</script>

<div class="field" class:overridden dir="rtl">
    {@render children()}
    {#if overridden}
        <div class="mark">
            <span class="dot" aria-hidden="true"></span>
            <span>{language.settings.overridden}</span>
            <button type="button" onclick={clear}>{language.settings.clearField}</button>
        </div>
    {/if}
    {#if resetError}<p role="alert">{language.settings.resetError}</p>{/if}
</div>

<style>
    .field {
        padding: 0.75rem;
        border-inline-start: 3px solid transparent;
        border-radius: 0.5rem;
    }
    .field.overridden {
        border-inline-start-color: var(--theme-brand-primary, #2563eb);
    }
    .mark {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-block-start: 0.5rem;
        color: var(--theme-brand-primary, #1d4ed8);
        font-size: 0.875rem;
    }
    .dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: currentColor;
    }
    button {
        min-height: 44px;
        padding: 0.4rem 0.75rem;
        border: 1px solid currentColor;
        border-radius: 0.5rem;
        cursor: pointer;
    }
    [role="alert"] {
        color: var(--theme-feedback-error, #b91c1c);
    }
</style>

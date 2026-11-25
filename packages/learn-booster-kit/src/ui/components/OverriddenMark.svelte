<script lang="ts" generics="T extends object">
    import type { Snippet } from "svelte";
    import { fromStore } from "svelte/store";
    import type { GameSettingsHandle } from "../../lib/config/game-settings";
    import { useGameSettingsSaveStatus } from "./GameSettingsPage.svelte";
    import { language } from "../language";
    import { overrideKeysStore } from "./override-keys-store";

    let {
        key,
        settings,
        children,
    }: {
        key: keyof T;
        settings: GameSettingsHandle<T>;
        children: Snippet;
    } = $props();
    const overrides = $derived(fromStore(overrideKeysStore(settings)));
    let resetError = $state(false);
    const reportSave = useGameSettingsSaveStatus();
    const overridden = $derived(overrides.current.includes(key));

    function clear() {
        resetError = reportSave(settings.clearOverride(key)).isErr();
    }
</script>

<div class={["field", { overridden }]} dir="rtl">
    {@render children()}
    {#if overridden}
        <div class="mark">
            <span class="dot" aria-hidden="true"></span>
            <span>{language.settings.overridden}</span>
            <button type="button" onclick={clear}
                >{language.settings.clearField}</button
            >
        </div>
    {/if}
    {#if resetError}<p role="alert">{language.settings.resetError}</p>{/if}
</div>

<style>
    .field {
        padding-inline-start: 0;
        border-inline-start: 3px solid transparent;
        border-radius: 0.5rem;
    }
    .field.overridden {
        padding-inline-start: 0.75rem;
        border-inline-start-color: var(--theme-panel-text-muted);
    }
    .mark {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-block-start: 0.5rem;
        color: var(--theme-panel-text-muted);
        font-size: 0.875rem;
    }
    .dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: var(--theme-brand-primary);
    }
    button {
        min-height: 44px;
        padding: 0.4rem 0.75rem;
        border: 1px solid currentColor;
        border-radius: 0.5rem;
        background: var(--theme-panel-field-bg);
        color: var(--theme-panel-field-text);
        cursor: pointer;
    }
    [role="alert"] {
        color: var(--theme-panel-text);
    }
</style>

<script lang="ts" generics="T extends object">
    import type { Snippet } from "svelte";
    import type { GameSettingsHandle } from "../../lib/config/game-settings";
    import OverriddenMark from "./OverriddenMark.svelte";

    let {
        label,
        description,
        key,
        settings,
        control,
        wide = false,
    }: {
        label: string;
        description?: string;
        key?: keyof T;
        settings?: GameSettingsHandle<T>;
        control: Snippet;
        wide?: boolean;
    } = $props();
    const id = $props.id();
</script>

{#snippet content()}
    <div class={["row-content", { wide }]}>
        <div class="copy">
            <strong id={`${id}-label`}>{label}</strong>
            {#if description}<p id={`${id}-description`}>{description}</p>{/if}
        </div>
        <div class="control">{@render control()}</div>
    </div>
{/snippet}

<div
    class="setting-row"
    role="group"
    aria-labelledby={`${id}-label`}
    aria-describedby={description ? `${id}-description` : undefined}
>
    {#if settings && key !== undefined}
        <OverriddenMark {key} {settings}>{@render content()}</OverriddenMark>
    {:else}
        {@render content()}
    {/if}
</div>

<style>
    .setting-row {
        box-sizing: border-box;
        padding: 1.25rem;
        border: 1px solid var(--theme-panel-card-border);
        border-radius: 1rem;
        background: var(--theme-panel-card-bg);
        color: var(--theme-panel-text);
        font-size: 1rem;
        direction: rtl;
    }
    .row-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    .copy {
        min-width: 0;
    }
    strong {
        font-size: 1.125rem;
        font-weight: 700;
    }
    p {
        margin-block: 0.35rem 0;
        font-size: 0.875rem;
        color: var(--theme-panel-text-muted);
    }
    .control {
        flex: 0 0 auto;
    }
    .wide {
        flex-direction: column;
        align-items: stretch;
    }
    .wide .control {
        width: 100%;
    }
</style>

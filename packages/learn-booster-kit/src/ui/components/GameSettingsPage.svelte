<script module lang="ts">
    import { getContext } from "svelte";
    import type { Result } from "../../lib/result";

    const settingsSaveStatusKey = Symbol("game-settings-save-status");

    /** מחבר תוצאת שמירה מפורשת לחיווי המסך, בלי כתיבה מתוך מינוי. */
    export function useGameSettingsSaveStatus() {
        const onSaved = getContext<(() => void) | undefined>(
            settingsSaveStatusKey,
        );
        return <Value, Error>(
            result: Result<Value, Error>,
        ): Result<Value, Error> => {
            if (result.isOk()) onSaved?.();
            return result;
        };
    }
</script>

<script lang="ts" generics="T extends object">
    import { onMount, setContext, type Snippet } from "svelte";
    import { fromStore } from "svelte/store";
    import type { Config } from "../../types";
    import type {
        GameSettingsHandle,
        GameSettingsScope,
    } from "../../lib/config/game-settings";
    import {
        addProfilesListener,
        getProfilesState,
    } from "../../lib/config/profile-manager";
    import { language } from "../language";
    import SegmentedControl from "../primitives/SegmentedControl.svelte";
    import ProfileBar from "./ProfileBar.svelte";
    import SettingsForm from "./SettingsForm.svelte";
    import { overrideKeysStore } from "./override-keys-store";

    let {
        title,
        onBack,
        settings,
        gameSection,
        config,
        handleShowVideo,
    }: {
        title: string;
        onBack: () => void;
        settings: GameSettingsHandle<T>;
        gameSection: Snippet<[GameSettingsScope]>;
        config: Config;
        handleShowVideo: (newConfig: Config) => void;
    } = $props();
    const text = language.settings;
    const id = $props.id();
    let profilesState = $state(getProfilesState());
    let selectedScope = $state<GameSettingsScope>("general");
    const overrides = $derived(fromStore(overrideKeysStore(settings)));
    let resetError = $state(false);
    let saved = $state(false);
    let savedTimeout: ReturnType<typeof setTimeout> | undefined;
    let form: SettingsForm | undefined = $state();

    const scope = $derived<GameSettingsScope>(
        profilesState.uiEnabled ? selectedScope : "general",
    );
    const activeName = $derived(
        profilesState.activeProfileId
            ? (profilesState.profiles[profilesState.activeProfileId]?.name ??
                  "")
            : "",
    );
    // הפרופיל נטען לפני init; מאגר המחזק עשוי עדיין להכיל ברירות מחדל.
    const boosterConfig = $derived(
        (profilesState.activeProfileId
            ? profilesState.profiles[profilesState.activeProfileId]
                  ?.boosterConfig
            : undefined) ?? config,
    );
    const scopeOptions = $derived([
        { value: "general" as const, label: text.general },
        { value: "profile" as const, label: text.profile(activeName) },
    ]);

    function showSaved() {
        saved = true;
        clearTimeout(savedTimeout);
        savedTimeout = setTimeout(() => {
            saved = false;
        }, 2000);
    }

    setContext(settingsSaveStatusKey, showSaved);

    onMount(() => {
        profilesState = getProfilesState();
        const removeProfiles = addProfilesListener((next) => {
            profilesState = next;
        });
        return () => {
            removeProfiles();
            clearTimeout(savedTimeout);
        };
    });

    function clearAll() {
        const result = settings.clearOverride();
        resetError = result.isErr();
        if (result.isOk()) showSaved();
    }
</script>

<div class="game-settings-page" dir="rtl">
    <div class="settings-panel">
        <header>
            <h1><span aria-hidden="true">⚙️</span> {text.title}</h1>
            <p class="saved" role="status">{saved ? text.saved : ""}</p>
            <button type="button" class="back" onclick={onBack}
                >{text.back}</button
            >
        </header>
        <ProfileBar
            immediate={true}
            getConfig={() =>
                form?.getProfileConfig() ??
                structuredClone($state.snapshot(boosterConfig))}
            onApply={(next) => form?.applyProfileConfig(next)}
            onSave={async () => (await form?.saveProfile()) ?? false}
        >
            {#snippet scopeControl()}
                <div class="scope-control">
                    <p>{text.scope}</p>
                    <SegmentedControl
                        options={scopeOptions}
                        value={scope}
                        onchange={(value) => {
                            selectedScope = value;
                        }}
                        aria-label={text.scope}
                    />
                </div>
            {/snippet}
            {#snippet layout(selection: Snippet, management: Snippet)}
                {@render selection()}
                <section class="game-section" aria-label={title}>
                    {#if overrides.current.length > 0}
                        <button
                            type="button"
                            class="clear-all"
                            onclick={clearAll}>{text.clearAll}</button
                        >
                    {/if}
                    {#if resetError}<p role="alert">{text.resetError}</p>{/if}
                    {@render gameSection(scope)}
                </section>
                <section
                    class="booster-section"
                    aria-labelledby={`${id}-booster`}
                >
                    <h2 id={`${id}-booster`}>
                        {profilesState.uiEnabled
                            ? text.boosterProfile(activeName)
                            : text.booster}
                    </h2>
                    <SettingsForm
                        bind:this={form}
                        config={boosterConfig}
                        {handleShowVideo}
                        embedded={true}
                        showProfiles={false}
                        onSaved={showSaved}
                    />
                </section>
                {@render management()}
            {/snippet}
        </ProfileBar>
    </div>
</div>

<style>
    .game-settings-page {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 2rem;
        color: var(--theme-panel-text);
        font-family: var(--theme-font-body, sans-serif);
        font-size: 1rem;
    }
    .settings-panel {
        width: 100%;
        max-width: 36rem;
        margin-inline: auto;
        display: grid;
        align-content: start;
        gap: 0.75rem;
    }
    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-block-end: 0.75rem;
    }
    h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: var(--theme-panel-text);
    }
    h2 {
        margin-block: 0.5rem 0.75rem;
        font-size: 1.125rem;
        font-weight: 700;
    }
    .scope-control p {
        margin-block: 0 0.5rem;
        font-size: 0.875rem;
        color: var(--theme-panel-text-muted);
    }
    .scope-control :global([role="radiogroup"]) {
        display: flex;
        background: var(--theme-panel-field-bg);
        border-radius: 0.5rem;
        padding: 0.25rem;
    }
    .scope-control :global([role="radio"]) {
        flex: 1;
        min-height: 44px;
        padding: 0.5rem;
        border: 0;
        border-radius: 0.4rem;
        background: transparent;
        color: var(--theme-panel-field-text);
        font-size: 1rem;
        cursor: pointer;
    }
    .scope-control :global([aria-checked="true"]) {
        background: var(--theme-brand-primary);
        color: var(--theme-text-on-brand);
    }
    .saved {
        flex: 1;
        margin: 0;
        font-size: 0.875rem;
        color: var(--theme-panel-text-muted);
    }
    button {
        min-height: 44px;
        padding: 0.5rem 1rem;
        border: 1px solid var(--theme-panel-card-border);
        border-radius: 0.75rem;
        background: var(--theme-panel-card-bg);
        color: var(--theme-panel-text);
        font-size: 1rem;
        cursor: pointer;
    }
    .clear-all {
        margin-block-end: 0.75rem;
    }
    .booster-section :global(input) {
        accent-color: var(--theme-brand-primary);
    }
    [role="alert"] {
        color: var(--theme-panel-text);
    }
    @media (max-width: 600px) {
        .game-settings-page {
            padding: 1rem;
        }
    }
</style>

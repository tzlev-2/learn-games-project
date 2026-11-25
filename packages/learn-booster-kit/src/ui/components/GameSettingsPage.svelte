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
        <header class="card">
            <h1>{title}</h1>
            <p class="saved" role="status">{saved ? text.saved : ""}</p>
            <button type="button" class="primary" onclick={onBack}
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
        </ProfileBar>
        <section class="card" aria-labelledby={`${id}-game`}>
            <div class="section-heading">
                <h2 id={`${id}-game`}>{text.game}</h2>
                {#if overrides.current.length > 0}
                    <button type="button" onclick={clearAll}
                        >{text.clearAll}</button
                    >
                {/if}
            </div>
            {#if resetError}<p role="alert">{text.resetError}</p>{/if}
            {@render gameSection(scope)}
        </section>
        <section class="booster-section" aria-labelledby={`${id}-booster`}>
            <h2 id={`${id}-booster`} class="card">
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
        padding: 1.5rem;
        color: #0f172a;
        font-family: var(--theme-font-body, sans-serif);
    }
    .settings-panel {
        width: 100%;
        max-width: 42rem;
        margin-inline: auto;
        display: grid;
        align-content: start;
        gap: 1rem;
    }
    .card,
    .settings-panel :global(.profile-bar),
    .booster-section :global(.settings-card) {
        box-sizing: border-box;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        background: #ffffff;
        box-shadow: 0 2px 8px #0f172a0d;
        color: #0f172a;
    }
    header,
    .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
    }
    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
    }
    h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
    }
    .scope-control p {
        margin-block: 0 0.75rem;
        color: #475569;
    }
    .scope-control :global([role="radiogroup"]) {
        display: flex;
        background: #f1f5f9;
        border-radius: 0.5rem;
        padding: 0.25rem;
    }
    .scope-control :global([role="radio"]) {
        flex: 1;
        min-height: 48px;
        padding: 0.5rem;
        border: 0;
        border-radius: 0.4rem;
        background: transparent;
        color: #475569;
        cursor: pointer;
    }
    .scope-control :global([aria-checked="true"]) {
        background: var(--theme-brand-primary, #4f46e5);
        color: #ffffff;
    }
    .saved {
        margin: 0;
        font-size: 0.875rem;
        color: #475569;
    }
    button {
        min-height: 48px;
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background: #ffffff;
        cursor: pointer;
    }
    .primary {
        background: var(--theme-brand-primary, #4f46e5);
        color: #ffffff;
    }
    .booster-section :global(input) {
        accent-color: var(--theme-brand-primary, #4f46e5);
    }
    [role="alert"] {
        color: #b91c1c;
    }
    @media (max-width: 600px) {
        .game-settings-page {
            padding: 0.75rem;
        }
    }
</style>

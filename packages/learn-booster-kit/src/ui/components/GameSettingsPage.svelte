<script lang="ts" generics="T extends object">
    import { onMount, type Snippet } from "svelte";
    import { fromStore } from "svelte/store";
    import type { Config } from "../../types";
    import type { GameSettingsHandle, GameSettingsScope } from "../../lib/config/game-settings";
    import { addProfilesListener, getProfilesState } from "../../lib/config/profile-manager";
    import { language } from "../language";
    import SegmentedControl from "../primitives/SegmentedControl.svelte";
    import ProfileBar from "./ProfileBar.svelte";
    import SettingsForm from "./SettingsForm.svelte";
    import { overrideKeysStore } from "./override-keys-store";

    interface Props {
        title: string;
        onBack: () => void;
        settings: GameSettingsHandle<T>;
        gameSection: Snippet<[GameSettingsScope]>;
        config: Config;
        handleShowVideo: (newConfig: Config) => void;
    }

    let { title, onBack, settings, gameSection, config, handleShowVideo }: Props = $props();
    const text = language.settings;
    const id = $props.id();
    let profilesState = $state(getProfilesState());
    let selectedScope = $state<GameSettingsScope>("general");
    const overrides = $derived(fromStore(overrideKeysStore(settings)));
    let resetError = $state(false);
    let form:
        | {
              getProfileConfig: () => Config;
              applyProfileConfig: (next: Config) => void;
              saveProfile: () => Promise<void>;
          }
        | undefined = $state();

    const scope = $derived<GameSettingsScope>(profilesState.uiEnabled ? selectedScope : "general");
    const activeName = $derived(
        profilesState.activeProfileId
            ? (profilesState.profiles[profilesState.activeProfileId]?.name ?? "")
            : "",
    );
    // הפרופיל נטען לפני init; מאגר המחזק עשוי עדיין להכיל ברירות מחדל.
    const boosterConfig = $derived(
        (profilesState.activeProfileId
            ? profilesState.profiles[profilesState.activeProfileId]?.boosterConfig
            : undefined) ?? config,
    );
    const scopeOptions = $derived([
        { value: "general" as const, label: text.general },
        { value: "profile" as const, label: text.profile(activeName) },
    ]);

    onMount(() => {
        profilesState = getProfilesState();
        return addProfilesListener((next) => {
            profilesState = next;
        });
    });

    function clearAll() {
        resetError = settings.clearOverride().isErr();
    }
</script>

<div class="game-settings-page" dir="rtl">
    <header>
        <h1>{title}</h1>
        <button type="button" onclick={onBack}>{text.back}</button>
    </header>
    <ProfileBar
        getConfig={() =>
            form?.getProfileConfig() ?? structuredClone($state.snapshot(boosterConfig))}
        onApply={(next) => form?.applyProfileConfig(next)}
        onSave={async () => {
            await form?.saveProfile();
        }}
    />
    {#if profilesState.uiEnabled}
        <SegmentedControl
            options={scopeOptions}
            value={scope}
            onchange={(value) => {
                selectedScope = value;
            }}
            aria-label={text.scope}
        />
    {/if}
    <section class="game-section" aria-labelledby={`${id}-game`}>
        <div class="section-heading">
            <h2 id={`${id}-game`}>{text.game}</h2>
            {#if overrides.current.length > 0}
                <button type="button" onclick={clearAll}>{text.clearAll}</button>
            {/if}
        </div>
        {#if resetError}<p role="alert">{text.resetError}</p>{/if}
        {@render gameSection(scope)}
    </section>
    <section aria-labelledby={`${id}-booster`}>
        <h2 id={`${id}-booster`}>{text.booster}</h2>
        <SettingsForm
            bind:this={form}
            config={boosterConfig}
            {handleShowVideo}
            embedded={true}
            showProfiles={false}
        />
    </section>
</div>

<style>
    .game-settings-page {
        box-sizing: border-box;
        width: 100%;
        max-width: 60rem;
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        margin-inline: auto;
        padding: 1.5rem;
        display: grid;
        align-content: start;
        gap: 1.25rem;
        background: var(--theme-surface-base, #f8fafc);
        color: var(--theme-text-primary, #172554);
        font-family: var(--theme-font-body, sans-serif);
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
        font-size: 1.75rem;
        font-weight: 700;
    }
    h2 {
        margin-block: 0 1rem;
        font-size: 1.25rem;
        font-weight: 700;
    }
    .game-section {
        padding: 1rem;
        border: 1px solid var(--theme-border-subtle, #e2e8f0);
        border-radius: 1rem;
        background: var(--theme-surface-elevated, white);
    }
    button {
        min-height: 48px;
        padding: 0.5rem 1rem;
        border: 1px solid var(--theme-border-subtle, #cbd5e1);
        border-radius: 0.5rem;
        cursor: pointer;
    }
    [role="alert"] {
        color: var(--theme-feedback-error, #b91c1c);
    }
    @media (max-width: 600px) {
        .game-settings-page {
            padding: 0.75rem;
        }
    }
</style>

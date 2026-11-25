<script lang="ts">
    import { onMount, type Snippet } from "svelte";
    import type { Config, Profile } from "../../types";
    import * as configManager from "../../lib/config/config-manager";
    import {
        addProfilesListener,
        createProfile,
        deleteProfile,
        getProfilesState,
        setActiveProfile,
        setProfilesUiEnabled,
    } from "../../lib/config/profile-manager";
    import { language } from "../language";

    interface Props {
        getConfig: () => Config;
        onApply: (config: Config) => void;
        onSave: () => Promise<boolean | void>;
        immediate?: boolean;
        scopeControl?: Snippet;
    }

    let {
        getConfig,
        onApply,
        onSave,
        immediate = false,
        scopeControl,
    }: Props = $props();
    const text = language.profiles;
    const id = $props.id();
    let profilesState = $state(getProfilesState());
    let selectedProfileId = $state("");
    let busy = $state(false);
    let error = $state(false);
    const orderedProfiles = $derived(
        profilesState.order
            .map((profileId) => profilesState.profiles[profileId])
            .filter((profile): profile is Profile => Boolean(profile)),
    );
    const selectedProfile = $derived(profilesState.profiles[selectedProfileId]);
    const canDelete = $derived(
        Boolean(
            selectedProfile &&
            orderedProfiles.length > 1 &&
            (immediate || selectedProfile.id !== profilesState.activeProfileId),
        ),
    );

    onMount(() => {
        profilesState = getProfilesState();
        selectedProfileId = profilesState.activeProfileId ?? "";
        return addProfilesListener((next) => {
            if (
                next.activeProfileId !== profilesState.activeProfileId ||
                !next.profiles[selectedProfileId]
            ) {
                selectedProfileId = next.activeProfileId ?? "";
            }
            profilesState = next;
        });
    });

    async function run(action: () => void | boolean | Promise<void | boolean>) {
        busy = true;
        error = false;
        try {
            await action();
        } catch (cause) {
            console.error(text.error, cause);
            error = true;
        } finally {
            if (immediate)
                selectedProfileId = profilesState.activeProfileId ?? "";
            busy = false;
        }
    }

    async function apply(profileId: string, skipConfirm = false) {
        if (!profileId) return;
        if (
            !immediate &&
            !skipConfirm &&
            profilesState.dirtyBoosterConfig &&
            !window.confirm(text.confirmSwitch)
        ) {
            selectedProfileId = profilesState.activeProfileId ?? "";
            return;
        }
        if (immediate && (await onSave()) === false) {
            selectedProfileId = profilesState.activeProfileId ?? "";
            error = true;
            return;
        }
        const profile = setActiveProfile(profileId);
        onApply(
            await configManager.updateConfig(
                structuredClone(profile.boosterConfig),
            ),
        );
    }

    async function create() {
        const name = window
            .prompt(
                text.promptName,
                text.suggestedName(orderedProfiles.length + 1),
            )
            ?.trim();
        if (!name) return;
        if (immediate && (await onSave()) === false) {
            error = true;
            return;
        }
        const profile = createProfile({ name, boosterConfig: getConfig() });
        selectedProfileId = profile.id;
        const active = setActiveProfile(profile.id);
        onApply(
            await configManager.updateConfig(
                structuredClone(active.boosterConfig),
            ),
        );
    }

    async function remove() {
        if (!canDelete || !selectedProfile) return;
        const removing = selectedProfile;
        if (!window.confirm(text.confirmDelete(removing.name))) return;
        if (immediate) {
            const replacement = orderedProfiles.find(
                (profile) => profile.id !== removing.id,
            );
            if (!replacement) return;
            await apply(replacement.id);
            if (getProfilesState().activeProfileId !== replacement.id) return;
        }
        deleteProfile(removing.id);
    }
</script>

<section
    class="profile-bar"
    dir="rtl"
    aria-labelledby={`${id}-title`}
    aria-busy={busy}
>
    <div class="heading">
        <div>
            <h2 id={`${id}-title`}>{text.title}</h2>
            <p>{immediate ? text.immediateDescription : text.description}</p>
        </div>
        <label class="toggle">
            <span>{text.show}</span>
            <input
                type="checkbox"
                checked={profilesState.uiEnabled}
                disabled={busy}
                onchange={(event) =>
                    void run(() =>
                        setProfilesUiEnabled(event.currentTarget.checked),
                    )}
            />
        </label>
    </div>
    {#if profilesState.uiEnabled}
        <label for={`${id}-select`}>{text.select}</label>
        <select
            id={`${id}-select`}
            bind:value={selectedProfileId}
            disabled={busy}
            onchange={(event) => {
                if (immediate) {
                    const profileId = event.currentTarget.value;
                    void run(() => apply(profileId));
                }
            }}
        >
            {#each orderedProfiles as profile (profile.id)}
                <option value={profile.id}
                    >{profile.name}{profile.id === profilesState.activeProfileId
                        ? text.active
                        : ""}</option
                >
            {:else}
                <option value="">{text.empty}</option>
            {/each}
        </select>
        {#if !immediate && profilesState.dirtyBoosterConfig}
            <p class="notice" role="status">{text.unsaved}</p>
        {/if}
        <div class="actions">
            {#if !immediate}
                <button
                    type="button"
                    onclick={() => void run(() => apply(selectedProfileId))}
                    disabled={busy || !selectedProfileId}>{text.apply}</button
                >
                <button
                    type="button"
                    class="primary"
                    onclick={() => void run(onSave)}
                    disabled={busy || !profilesState.activeProfileId}
                    >{text.save}</button
                >
            {/if}
            <button
                type="button"
                onclick={() => void run(create)}
                disabled={busy}>{text.create}</button
            >
            <button
                type="button"
                class="danger"
                onclick={() => void run(remove)}
                disabled={busy || !canDelete}>{text.delete}</button
            >
        </div>
        {#if scopeControl}
            <div class="scope-control">{@render scopeControl()}</div>
        {/if}
    {/if}
    {#if error}<p class="error" role="alert">{text.error}</p>{/if}
</section>

<style>
    .profile-bar {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        background: #ffffff;
        color: #0f172a;
    }
    .scope-control {
        margin-block-start: 1rem;
        border-block-start: 1px solid #e2e8f0;
        padding-block-start: 1rem;
    }
    .heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-block-end: 1rem;
    }
    h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
    }
    p {
        margin-block: 0.4rem;
        font-size: 0.85rem;
        color: #475569;
    }
    .toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 44px;
        cursor: pointer;
    }
    input {
        position: static !important;
        width: 1.25rem;
        height: 1.25rem;
        accent-color: var(--theme-brand-primary, #4f46e5);
    }
    select {
        display: block;
        width: 100%;
        min-height: 48px;
        padding: 0.6rem;
        margin-block: 0.4rem 0.8rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background: #ffffff;
        color: inherit;
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    button {
        flex: 1 1 10rem;
        min-height: 48px;
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        cursor: pointer;
    }
    button:disabled {
        opacity: 0.5;
        cursor: default;
    }
    .primary {
        background: var(--theme-brand-primary, #4f46e5);
        color: #ffffff;
    }
    .danger,
    .error {
        color: #b91c1c;
    }
    .notice {
        padding: 0.75rem;
        border: 1px solid #fbbf24;
        border-radius: 0.5rem;
        background: #fffbeb;
        color: #78350f;
    }
</style>

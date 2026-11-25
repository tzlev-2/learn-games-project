<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import {
    GameSettingsPage,
    boosterService,
    configStore,
  } from "learn-booster-kit";
  import { settingsHandle } from "$lib/stores/settings.svelte";
  import { initializeBooster } from "$lib/services/booster-init";
  import { language } from "$lib/services/language";
  import GameSettingsFields from "./_components/GameSettingsFields.svelte";

  let ready = $state(false);
  let initializationError = $state(false);

  onMount(() => {
    let mounted = true;
    async function initialize() {
      try {
        await initializeBooster();
        if (mounted) ready = true;
      } catch {
        if (mounted) initializationError = true;
      }
    }
    void initialize();
    return () => {
      mounted = false;
    };
  });
</script>

<svelte:head>
  <title>{language.settingsPageTitle}</title>
</svelte:head>

{#if initializationError}
  <p class="initialization-message" role="alert">
    {language.initializationError}
  </p>
{:else if !ready}
  <p class="initialization-message" role="status">{language.settingsLoading}</p>
{:else}
  <GameSettingsPage
    title={language.settingsHeading}
    onBack={() => void goto(`${base}/`)}
    settings={settingsHandle}
    config={$configStore}
    handleShowVideo={(config) =>
      void boosterService.triggerReward(undefined, config)}
  >
    {#snippet gameSection(scope)}
      <GameSettingsFields {scope} />
    {/snippet}
  </GameSettingsPage>
{/if}

<style>
  .initialization-message {
    padding: 1.5rem;
    text-align: center;
    color: white;
    direction: rtl;
  }
</style>

<script lang="ts">
  import "./app.css";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { settings } from "$lib/stores/settings.svelte";
  import { gameState } from "$lib/stores/game-state.svelte";
  import { language } from "$lib/services/language";
  import {
    boosterService,
    BoosterContainer,
    AdminGate,
    GameShell,
    HeaderBar,
    IconButton,
    ScoreBadge,
    HomeIcon,
    SettingsIcon,
  } from "learn-booster-kit";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    if (settings.boosterEnabled) {
      boosterService.init();
    }
  });

  function handleHome() {
    gameState.reset();
    goto(`${base}/`);
  }
</script>

<svelte:head>
  <title>{language.pageTitle}</title>
</svelte:head>

<!-- רקע כהה בסגנון מסך נעילה של iOS — נשאר מאחורי ה-shell (background="none") -->
<div
  class="h-screen overflow-hidden bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900"
>
  <GameShell layout="fill" background="none">
    {#snippet header()}
      <HeaderBar balanced class="pc-header relative z-10">
        {#snippet leftActions()}
          <IconButton label={language.homeLabel} variant="floating" onclick={handleHome}>
            {#snippet icon()}<HomeIcon size={22} />{/snippet}
          </IconButton>
        {/snippet}

        {#snippet centerInfo()}
          <ScoreBadge
            label={language.successCountLabel}
            value={gameState.correctCount}
            variant="success"
            class="pc-score"
          />
        {/snippet}

        {#snippet rightActions()}
          <!-- כפתור הגדרות מוגן (AdminGate חוסם תלמידים) -->
          <AdminGate onUnlock={() => goto(`${base}/settings`)}>
            <IconButton label={language.settingsLabel} variant="floating">
              {#snippet icon()}<SettingsIcon size={22} />{/snippet}
            </IconButton>
          </AdminGate>
        {/snippet}
      </HeaderBar>
    {/snippet}

    <div class="flex h-full flex-col">
      {@render children()}
    </div>
  </GameShell>
</div>

<div class="relative z-[9999] pointer-events-none">
  <BoosterContainer />
</div>

<style>
  /* ה-header המקורי: slate-800 בלי מסגרת תחתונה, על רקע כהה */
  :global(.pc-header) {
    border-bottom-color: transparent;
  }
  /* הערך במקור: text-xl ירוק, בלי מסגרת */
  :global(.pc-score) {
    font-size: 1.25rem;
    border-color: transparent;
  }
</style>

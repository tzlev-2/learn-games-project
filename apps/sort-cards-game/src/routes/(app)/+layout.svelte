<script lang="ts">
  import "../app.css";
  import { goto } from "$app/navigation";
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
    goto("/");
  }
</script>

<!-- ה-gradient של המשחק נשאר מאחורי ה-shell (background="none").
     layout="fill": ה-shell ממלא את h-screen והדפים ממלאים את השטח שמתחת ל-header. -->
<div
  class="h-screen overflow-hidden bg-linear-to-b from-amber-100 via-orange-50 to-yellow-100"
>
  <GameShell layout="fill" background="none">
    {#snippet header()}
      <HeaderBar balanced class="relative z-10">
        {#snippet leftActions()}
          <IconButton label={language.homeLabel} onclick={handleHome}>
            {#snippet icon()}<HomeIcon size={24} />{/snippet}
          </IconButton>
        {/snippet}

        {#snippet centerInfo()}
          <ScoreBadge
            label={language.cardsLabel}
            value="{gameState.sortedCardsInRound}/{gameState.totalCardsInRound}"
            variant="success"
            class="sc-score"
          />
          <ScoreBadge
            label={language.correctLabel}
            value={gameState.correctCount}
            variant="warning"
            class="sc-score"
          />
        {/snippet}

        {#snippet rightActions()}
          <!-- כפתור הגדרות מוגן (AdminGate חוסם תלמידים) -->
          <AdminGate onUnlock={() => goto("/settings")}>
            <IconButton label={language.settingsLabel}>
              {#snippet icon()}<SettingsIcon size={24} />{/snippet}
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
  /* ה-header המקורי הציג את הערכים בטקסט גדול (text-lg), בלי מסגרת */
  :global(.sc-score) {
    font-size: 1.125rem;
    border-color: transparent;
  }
</style>

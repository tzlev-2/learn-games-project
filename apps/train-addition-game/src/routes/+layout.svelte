<script lang="ts">
  import "./app.css";
  import { goto } from "$app/navigation";
  import { settings } from "$lib/stores/settings.svelte";
  import { gameState } from "$lib/stores/game-state.svelte";
  import { language } from "$lib/services/language";
  import {
    boosterService,
    AdminGate,
    GameShell,
    HeaderBar,
    IconButton,
    ScoreBadge,
    HomeIcon,
    SettingsIcon,
  } from "learn-booster-kit";
  import { onMount } from "svelte";
  import { preloadAllAssets } from "$lib/utils/tts";

  let { children } = $props();

  onMount(() => {
    if (settings.boosterEnabled) {
      boosterService.init();
    }
    preloadAllAssets();
  });
</script>

<!-- ה-gradient של השמיים נשאר מאחורי ה-shell (background="none").
     layout="fill": ה-shell ממלא את h-screen והדפים ממלאים את השטח שמתחת ל-header. -->
<div
  class="h-screen overflow-hidden bg-linear-to-b from-sky-300 via-sky-400 to-sky-500"
>
  <GameShell layout="fill" background="none">
    {#snippet header()}
      <!-- relative z-10: מעל רקע ה-GameWorld (fixed inset-0) -->
      <HeaderBar balanced class="relative z-10">
        {#snippet leftActions()}
          <IconButton label={language.homeLabel} variant="floating" onclick={() => goto("/")}>
            {#snippet icon()}<HomeIcon size={22} />{/snippet}
          </IconButton>
        {/snippet}

        {#snippet centerInfo()}
          <ScoreBadge
            label={language.roundLabel}
            value={gameState.roundNumber}
            variant="success"
            class="ta-score"
          />
          <ScoreBadge
            label={language.correctLabel}
            value={gameState.correctCount}
            variant="warning"
            class="ta-score"
          />
        {/snippet}

        {#snippet rightActions()}
          <!-- כפתור הגדרות מוגן (AdminGate חוסם תלמידים) -->
          <AdminGate onUnlock={() => goto("/settings")}>
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

<style>
  /* ה-header המקורי הציג את הערכים בטקסט גדול (text-lg), בלי מסגרת */
  :global(.ta-score) {
    font-size: 1.125rem;
    border-color: transparent;
  }
</style>

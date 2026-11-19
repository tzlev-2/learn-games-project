<!--
	פאנל תשובות - כפתורים לכל הספרות 1-10
	עם טיימר המתנה של 10 שניות לאחר טעות
-->
<script lang="ts">
  import { gameState } from "$lib/stores/game-state.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { playError } from "$lib/utils/sound";
  import { language } from "$lib/services/language";
  import { CooldownRing } from "learn-booster-kit";

  // האם פאנל התשובות פעיל
  const isActive = $derived(gameState.state === "CHOOSE_ANSWER");

  // בדיקת cooldown
  let now = $state(Date.now());

  // עדכון הזמן הנוכחי כל 100ms
  $effect(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 100);
    return () => clearInterval(interval);
  });

  const isOnCooldown = $derived(now < gameState.cooldownUntilTs);

  function handleSelect(answer: number) {
    if (!isActive) return;

    if (isOnCooldown) {
      // אם מופעל איפוס טיימר בלחיצה — מאפסים את ה-cooldown
      if (settings.resetCooldownOnTap) {
        gameState.cooldownUntilTs = Date.now() + settings.cooldownMs;
        playError();
      }
      return;
    }

    gameState.selectAnswer(answer);
  }

  // כל הספרות האפשריות 1-10
  const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // האם להציג את הפאנל (גם אם לא פעיל, כדי לתפוס מקום)
  const showPanel = $derived(
    gameState.state === "CHOOSE_ANSWER" ||
      gameState.state === "FEEDBACK_CORRECT" ||
      gameState.state === "FEEDBACK_WRONG"
  );
</script>

<div
  class="flex flex-col items-center gap-4 transition-opacity duration-300 {showPanel
    ? 'opacity-100'
    : 'invisible opacity-0'}"
  aria-hidden={!showPanel}
>
  <!-- כפתורי תשובה - כל הספרות 1-10 -->
  <div
    id="answer-buttons-container"
    class="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 md:flex md:flex-wrap md:justify-center max-w-4xl"
    dir="ltr"
  >
    {#each allDigits as digit}
      <button
        onclick={() => handleSelect(digit)}
        disabled={!isActive || (isOnCooldown && !settings.resetCooldownOnTap)}
        class="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold
						shadow-lg transition-all sm:h-14 sm:w-14 sm:text-2xl md:h-16 md:w-16 md:text-2xl xl:h-20 xl:w-20 xl:text-3xl
						{isActive && !isOnCooldown
          ? 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95'
          : 'cursor-not-allowed bg-gray-300 text-gray-500'}"
      >
        {digit}
      </button>
    {/each}
  </div>

  <!-- טיימר cooldown — טבעת inline של הקיט (תופסת מקום תמיד) -->
  <CooldownRing
    untilTs={gameState.cooldownUntilTs}
    durationMs={settings.cooldownMs}
    message={language.cooldownMessage}
  />
</div>

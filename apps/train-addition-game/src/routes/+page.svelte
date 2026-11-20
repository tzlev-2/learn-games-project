<script lang="ts">
  import { goto } from "$app/navigation";
  import { StartScreen } from "learn-booster-kit";
  import { gameState } from "$lib/stores/game-state.svelte";
  import { language } from "$lib/services/language";

  function handleStart() {
    gameState.startRound(); // Initialize state if needed
    goto("/game");
  }
</script>

<svelte:head>
  <title>{language.pageTitle}</title>
  <meta name="description" content={language.pageDescription} />
</svelte:head>

<!-- כותרת לבנה על השמיים: ה-theme (slate) מגדיר כותרת כהה, ומסך זה דורס מקומית (ta-start) -->
<StartScreen
  title={language.gameTitle}
  subtitle={language.startSubtitle}
  background="none"
  layout="fill"
  class="ta-start ta-fade-in"
  primaryAction={{
    label: language.startButton,
    onclick: handleStart,
    color: "secondary",
    icon: ctaIcon,
    class: "ta-start-btn",
  }}
/>

{#snippet ctaIcon()}
  <span aria-hidden="true">🎮</span>
{/snippet}

<style>
  @keyframes -global-ta-fade-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  :global(.ta-fade-in) {
    animation: ta-fade-in 0.6s ease-out;
  }

  /* כותרת ותת-כותרת לבנות ובמשקל 700 (במקור text-white font-bold / text-white/90) */
  :global(.ta-start) {
    --theme-text-heading: #ffffff;
    --theme-font-weight-display: 700;
    --color-text-secondary: rgb(255 255 255 / 0.9);
  }
  /* תת-הכותרת: text-xl → md:text-2xl כמו במקור */
  @media (min-width: 48rem) {
    :global(.ta-start) {
      --theme-font-size-lg: 1.5rem;
    }
  }
  /* הכותרת קופצת (animate-bounce) עם צל (drop-shadow-lg), כמו במקור */
  :global(.ta-start h1) {
    filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.15));
    animation: ta-bounce 1s infinite;
  }
  /* זהה ל-animate-bounce של Tailwind */
  @keyframes -global-ta-bounce {
    0%,
    100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: none;
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }

  /* ה-CTA של המשחק: gradient ירוק, פינות rounded-2xl וטקסט גדול — על בסיס Button של הקיט */
  :global(.ta-start-btn) {
    background-image: linear-gradient(
      to bottom right,
      var(--theme-brand-secondary),
      #16a34a
    );
    border-radius: 1rem;
    font-size: 1.875rem;
    padding-block: 1.25rem;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    transition: transform 0.3s;
  }
  :global(.ta-start-btn:hover) {
    transform: scale(1.05);
  }
  :global(.ta-start-btn:active) {
    transform: scale(0.95);
  }
</style>

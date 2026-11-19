<script lang="ts">
  import { goto } from "$app/navigation";
  import { StartScreen } from "learn-booster-kit";
  import { gameState } from "$lib/stores/game-state.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { ALL_CONTENT_PACKS } from "$lib/data/content-packs";
  import { language } from "$lib/services/language";

  function handleStart() {
    gameState.startGame();
    goto("/game");
  }
</script>

<svelte:head>
  <title>{language.pageTitle}</title>
  <meta name="description" content={language.pageDescription} />
</svelte:head>

<!-- layout="fill": מסך הפתיחה יושב מתחת ל-header וגולל אם הבורר לא נכנס -->
<StartScreen
  title={language.gameTitle}
  subtitle={language.startSubtitle}
  background="none"
  layout="fill"
  class="sc-fade-in py-4"
  primaryAction={{
    label: language.startButton,
    onclick: handleStart,
    color: "secondary",
    icon: ctaIcon,
    class: "sc-start-btn",
  }}
>
  <!-- בחירת חבילת תוכן -->
  <div class="w-full max-w-lg" role="radiogroup" aria-labelledby="pack-picker-label">
    <p id="pack-picker-label" class="m-0 mb-3 text-lg font-bold text-slate-700">
      {language.choosePackLabel}
    </p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each ALL_CONTENT_PACKS as pack}
        <button
          role="radio"
          aria-checked={settings.contentPackId === pack.id}
          onclick={() => {
            settings.contentPackId = pack.id;
          }}
          class="pack-card rounded-xl p-4 text-right transition-all duration-200 {settings.contentPackId ===
          pack.id
            ? 'bg-amber-400 shadow-lg scale-[1.02] ring-2 ring-amber-500'
            : 'bg-white/80 shadow-md hover:shadow-lg hover:scale-[1.01]'}"
        >
          <div class="flex items-center gap-3">
            <span class="text-3xl">{pack.icon}</span>
            <div>
              <div class="font-bold text-slate-800">{pack.name}</div>
              <div class="text-sm text-slate-500">{pack.description}</div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
</StartScreen>

{#snippet ctaIcon()}
  <span aria-hidden="true">🎮</span>
{/snippet}

<style>
  @keyframes -global-sc-fade-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  :global(.sc-fade-in) {
    animation: sc-fade-in 0.6s ease-out;
  }

  /* ה-CTA של המשחק: gradient ירוק, פינות rounded-2xl וטקסט גדול — על בסיס Button של הקיט */
  :global(.sc-start-btn) {
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
  :global(.sc-start-btn:hover) {
    transform: scale(1.05);
  }
  :global(.sc-start-btn:active) {
    transform: scale(0.95);
  }
</style>

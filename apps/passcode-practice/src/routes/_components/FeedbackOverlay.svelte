<!--
  Overlay להצגת משוב הצלחה/שגיאה
  pointer-events-none — לא חוסם את הלוח
-->
<script lang="ts">
  import { CheckIcon, XIcon } from "learn-booster-kit";
  import { gameState } from "$lib/stores/game-state.svelte";
  import { language } from "$lib/services/language";

  const text = language.feedback;
  const isSuccess = $derived(gameState.state === "SUCCESS");
  const isError = $derived(gameState.state === "ERROR");
  const isVisible = $derived(isSuccess || isError);
</script>

{#if isVisible}
  <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    {#if isSuccess}
      <div
        class="animate-success-pop relative rounded-3xl bg-gradient-to-br from-green-400 to-green-600
               px-12 py-8 text-center text-white shadow-2xl"
      >
        <div class="animate-bounce mb-2 flex justify-center"><CheckIcon size={96} /></div>
        <div class="text-4xl font-bold">{text.correct}</div>
        <div class="mt-2 text-xl">{text.praise}</div>
      </div>
    {:else if isError}
      <div
        class="animate-error-shake rounded-3xl bg-gradient-to-br from-orange-400 to-red-500
               px-10 py-7 text-center text-white shadow-2xl"
      >
        <div class="mb-2 flex justify-center"><XIcon size={72} /></div>
        <div class="text-3xl font-bold">{text.wrong}</div>
        <div class="mt-2 text-lg">{text.retry}</div>
      </div>
    {/if}
  </div>
{/if}

<style>
  @keyframes success-pop {
    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(5deg); }
    70% { transform: scale(0.9) rotate(-3deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .animate-success-pop {
    animation: success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes error-shake {
    0%, 100% { transform: translateX(0); }
    15%, 45%, 75% { transform: translateX(-10px); }
    30%, 60%, 90% { transform: translateX(10px); }
  }

  .animate-error-shake {
    animation: error-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

</style>

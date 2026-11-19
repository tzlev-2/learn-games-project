<script lang="ts">
  import SettingsControls from "./_components/SettingsControls.svelte";
  import { goto } from "$app/navigation";
  import { Button } from "learn-booster-kit";
  import { language } from "$lib/services/language";
</script>

<!-- רקע כללי של הדף -->
<div
  class="w-full flex-1 h-full overflow-y-auto bg-slate-100 p-4 md:p-8 font-sans"
  dir="rtl"
>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex items-center justify-between sticky top-0 bg-slate-100/90 backdrop-blur-sm z-10 py-4"
    >
      <h1 class="text-3xl font-bold text-slate-800">{language.settingsHeading}</h1>
      <Button color="secondary" onclick={() => goto("/game")} class="ta-back-btn">
        {language.backToGame}
      </Button>
    </div>

    <!-- Controls -->
    <SettingsControls />
  </div>
</div>

<style>
  /* "חזרה למשחק" — ירוק כהה (green-600) ופינות rounded-xl כמו במקור, על בסיס Button של הקיט */
  :global(.ta-back-btn) {
    background-color: #16a34a;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }
  :global(.ta-back-btn:hover) {
    background-color: #15803d;
  }
</style>

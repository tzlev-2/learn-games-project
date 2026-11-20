<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";
  import { settings } from "$lib/stores/settings.svelte";
  import { ALL_CONTENT_PACKS } from "$lib/data/content-packs";
  import {
    boosterService,
    type Config,
    updateConfig as updateBoosterConfig,
    getAppsList as getAppsListFromFully,
    type AppListItem,
    isFullyKiosk,
    OverlayTimerSettings,
    Card,
    Button,
    SegmentedControl,
  } from "learn-booster-kit";
  import { language } from "$lib/services/language";
  import type { TeacherSettings } from "$lib/types";
  import { onMount, onDestroy } from "svelte";

  type GameMode = TeacherSettings["gameMode"];

  let config = $state<Config>();
  let unsubscribeConfig: () => void;
  let appList = $state<AppListItem[]>([]);
  let loadingApps = $state(false);

  onMount(async () => {
    if (settings.boosterEnabled) {
      await boosterService.init();
    }

    unsubscribeConfig = boosterService.config.subscribe((v) => {
      config = v;
    });

    if (isFullyKiosk()) {
      loadingApps = true;
      try {
        appList = await getAppsListFromFully();
      } catch (e) {
        console.error("Failed to load apps", e);
      } finally {
        loadingApps = false;
      }
    }
  });

  onDestroy(() => {
    if (unsubscribeConfig) unsubscribeConfig();
  });

  const gameModeOptions: { value: GameMode; label: string }[] = [
    { value: "manual_end", label: language.gameModeManual },
    { value: "continuous", label: language.gameModeContinuous },
  ];

  function handleBack() {
    goto("/");
  }

  async function updateConfig(newConfig: Config) {
    try {
      config = newConfig;
      config = await updateBoosterConfig(newConfig);
    } catch (e) {
      console.error("Failed to update config", e);
    }
  }

  function updateRewardType(type: "video" | "app" | "site") {
    if (!config) return;
    updateConfig({ ...config, rewardType: type });
  }

  function updateVideoSource(source: "local" | "google-drive" | "youtube") {
    if (!config) return;
    updateConfig({ ...config, video: { ...config.video, source } });
  }

  function updateBoosterUrl(url: string) {
    if (!config) return;
    updateConfig({ ...config, booster: { ...config.booster, siteUrl: url } });
  }

  function updateAppPackage(packageName: string) {
    if (!config) return;
    updateConfig({ ...config, app: { ...config.app, packageName } });
  }

  function updateNumberField(
    field: "turnsPerReward" | "rewardDisplayDurationMs",
    value: number,
  ) {
    if (!config) return;
    updateConfig({ ...config, [field]: value });
  }
</script>

<svelte:head>
  <title>{language.settingsPageTitle}</title>
</svelte:head>

<div class="h-full overflow-y-auto p-4 md:p-8">
  <div class="mx-auto max-w-lg">
    <!-- כותרת -->
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-black text-slate-800">{language.settingsHeading}</h1>
      <Button size="sm" onclick={handleBack} class="sc-back-btn">
        {language.backLabel}
      </Button>
    </div>

    <div class="space-y-6">
      <!-- חבילת תוכן -->
      <Card>
        <label class="block text-lg font-bold text-slate-700 mb-3">
          חבילת תוכן
        </label>
        <select
          bind:value={settings.contentPackId}
          class="w-full rounded-xl border-2 border-slate-300 p-3 text-lg"
        >
          {#each ALL_CONTENT_PACKS as pack}
            <option value={pack.id}>{pack.icon} {pack.name}</option>
          {/each}
        </select>
      </Card>

      <!-- כרטיסים בסיבוב -->
      <Card>
        <label class="block text-lg font-bold text-slate-700 mb-3">
          כרטיסים בסיבוב: {settings.cardsPerRound}
        </label>
        <input
          type="range"
          bind:value={settings.cardsPerRound}
          min="4"
          max="16"
          step="1"
          class="w-full accent-amber-500"
        />
        <div class="flex justify-between text-sm text-slate-500 mt-1">
          <span>4</span>
          <span>16</span>
        </div>
      </Card>

      <!-- זמן המתנה בטעות -->
      <Card class="space-y-4">
        <div>
          <label class="block text-lg font-bold text-slate-700 mb-3">
            שניות המתנה בטעות: {(settings.cooldownMs / 1000).toFixed(0)}
          </label>
          <input
            type="range"
            bind:value={settings.cooldownMs}
            min="1000"
            max="10000"
            step="500"
            class="w-full accent-amber-500"
          />
          <div class="flex justify-between text-sm text-slate-500 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <label class="flex items-center justify-between pt-2 border-t border-slate-200">
          <div>
            <span class="text-lg font-bold text-slate-700">איפוס טיימר בלחיצה</span>
            <p class="text-sm text-slate-500">גרירה בזמן המתנה מאפסת את הספירה</p>
          </div>
          <input
            type="checkbox"
            bind:checked={settings.resetCooldownOnTap}
            class="h-6 w-6 accent-amber-500"
          />
        </label>
      </Card>

      <!-- ערבוב -->
      <Card class="space-y-4">
        <label class="flex items-center justify-between">
          <span class="text-lg font-bold text-slate-700">ערבוב כרטיסים</span>
          <input
            type="checkbox"
            bind:checked={settings.shuffleCards}
            class="h-6 w-6 accent-amber-500"
          />
        </label>

        <label class="flex items-center justify-between">
          <span class="text-lg font-bold text-slate-700">ערבוב סיבובים</span>
          <input
            type="checkbox"
            bind:checked={settings.shuffleRounds}
            class="h-6 w-6 accent-amber-500"
          />
        </label>
      </Card>

      <!-- מצב משחק -->
      <Card>
        <p id="game-mode-label" class="m-0 block text-lg font-bold text-slate-700 mb-3">
          {language.gameModeLabel}
        </p>
        <SegmentedControl
          options={gameModeOptions}
          bind:value={settings.gameMode}
          aria-label={language.gameModeLabel}
          class="w-full"
        />
      </Card>

      <!-- הקראה -->
      <Card>
        <label class="flex items-center justify-between">
          <div>
            <span class="text-lg font-bold text-slate-700">הקראת משוב</span>
            <p class="text-sm text-slate-500">הקראת "כל הכבוד" / "נסה שוב" בקול</p>
          </div>
          <input
            type="checkbox"
            bind:checked={settings.voiceEnabled}
            class="h-6 w-6 accent-amber-500"
          />
        </label>
      </Card>

      <!-- חיזוקים (Booster) -->
      <Card class="space-y-4">
        <label class="flex items-center justify-between">
          <div>
            <span class="text-lg font-bold text-slate-700">חיזוקים (Gingim Booster)</span>
            <p class="text-sm text-slate-500">הפעלת מנגנון חיזוקים לאחר הצלחה</p>
          </div>
          <input
            type="checkbox"
            checked={settings.boosterEnabled}
            onchange={() => {
              settings.boosterEnabled = !settings.boosterEnabled;
              if (settings.boosterEnabled) boosterService.init();
            }}
            class="h-6 w-6 accent-amber-500"
          />
        </label>

        {#if settings.boosterEnabled}
          {#if config}
            <div
              transition:slide={{ duration: 300, axis: "y" }}
              class="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200"
            >
              <!-- סוג פרס -->
              <div class="space-y-2">
                <label for="reward-type-select" class="block font-medium text-slate-700">
                  סוג פרס
                </label>
                <select
                  id="reward-type-select"
                  value={config.rewardType}
                  onchange={(e) => updateRewardType(e.currentTarget.value as any)}
                  class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
                >
                  <option value="video">וידאו</option>
                  <option value="app">אפליקציה</option>
                  <option value="site">אתר</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- תורות לחיזוק -->
                <div class="space-y-2">
                  <label for="turns-input" class="block font-medium text-slate-700">
                    תורות לחיזוק
                  </label>
                  <input
                    id="turns-input"
                    type="number"
                    min="1"
                    value={config.turnsPerReward}
                    onchange={(e) =>
                      updateNumberField("turnsPerReward", parseInt(e.currentTarget.value))}
                    class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-center"
                  />
                </div>

                <!-- משך פרס -->
                <div class="space-y-2">
                  <label for="duration-input" class="block font-medium text-slate-700">
                    משך (שניות)
                  </label>
                  <input
                    id="duration-input"
                    type="number"
                    min="1"
                    value={Math.floor(config.rewardDisplayDurationMs / 1000)}
                    onchange={(e) =>
                      updateNumberField("rewardDisplayDurationMs", parseInt(e.currentTarget.value) * 1000)}
                    class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 text-center"
                  />
                </div>
              </div>

              <!-- בדיקת מחזק -->
              <button
                onclick={async () => { await boosterService.triggerReward(); }}
                class="w-full rounded-lg bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-200"
              >
                בדיקת מחזק
              </button>

              <!-- הגדרות טיימר אוברליי -->
              <div class="pt-2 border-t border-slate-200 mt-2">
                <OverlayTimerSettings />
              </div>

              <!-- הגדרות ספציפיות לסוג -->
              <div class="pt-2 border-t border-slate-200 mt-2">
                {#if config.rewardType === "video"}
                  <div class="space-y-3">
                    <div class="space-y-1">
                      <label for="video-source-select" class="text-sm font-medium text-slate-700">
                        מקור הווידאו
                      </label>
                      <select
                        id="video-source-select"
                        value={config.video.source}
                        onchange={(e) => updateVideoSource(e.currentTarget.value as any)}
                        class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="local">תיקייה מקומית (Fully Kiosk)</option>
                        <option value="google-drive">גוגל דרייב</option>
                      </select>
                    </div>

                    {#if config.video.source === "google-drive"}
                      <div class="space-y-1">
                        <label for="gdrive-folder-input" class="text-sm font-medium text-slate-700">
                          קישור לתיקייה
                        </label>
                        <input
                          id="gdrive-folder-input"
                          type="text"
                          value={config.video.googleDriveFolderUrl || ""}
                          onchange={(e) => {
                            const newConfig = {
                              ...config!,
                              video: {
                                ...config!.video,
                                googleDriveFolderUrl: e.currentTarget.value,
                              },
                            };
                            updateConfig(newConfig);
                          }}
                          placeholder="הדבק קישור לתיקיית דרייב..."
                          dir="ltr"
                          class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    {/if}
                  </div>
                {:else if config.rewardType === "site"}
                  <div class="space-y-2">
                    <label for="site-url-input" class="text-sm font-medium text-slate-700">
                      כתובת האתר
                    </label>
                    <input
                      id="site-url-input"
                      type="url"
                      value={config.booster.siteUrl}
                      onchange={(e) => updateBoosterUrl(e.currentTarget.value)}
                      placeholder="https://example.com"
                      dir="ltr"
                      class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                {:else if config.rewardType === "app"}
                  <div class="space-y-2">
                    <label for="app-selection" class="text-sm font-medium text-slate-700">
                      בחירת אפליקציה
                    </label>
                    {#if loadingApps}
                      <div class="text-xs text-slate-500">טוען רשימת אפליקציות...</div>
                    {:else if appList.length > 0}
                      <select
                        id="app-selection"
                        value={config.app.packageName}
                        onchange={(e) => updateAppPackage(e.currentTarget.value)}
                        class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">בחר אפליקציה...</option>
                        {#each appList as app}
                          <option value={app.package}>{app.label}</option>
                        {/each}
                      </select>
                    {:else}
                      <div class="text-xs text-orange-500">
                        לא נמצאו אפליקציות (האם Fully Kiosk פעיל?)
                      </div>
                      <input
                        id="app-selection"
                        type="text"
                        value={config.app.packageName}
                        onchange={(e) => updateAppPackage(e.currentTarget.value)}
                        placeholder="שם חבילה (למשל com.example.app)"
                        dir="ltr"
                        class="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 mt-1"
                      />
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {:else}
            <div class="text-center text-slate-400 py-4 animate-pulse">
              טוען הגדרות...
            </div>
          {/if}
        {/if}
      </Card>

      <!-- איפוס -->
      <button
        onclick={() => settings.reset()}
        class="w-full rounded-2xl bg-red-100 p-4 text-lg font-bold text-red-600 transition-colors hover:bg-red-200"
      >
        🔄 איפוס להגדרות ברירת מחדל
      </button>
    </div>
  </div>
</div>

<style>
  /* כפתור "חזרה" — פינות rounded-xl כמו במקור (Button של הקיט הוא pill) */
  :global(.sc-back-btn) {
    border-radius: 0.75rem;
    font-size: 1rem;
  }
</style>

import pkg from "../../../package.json" with { type: "json" };

import {
  getActiveProfile,
  initializeProfiles,
  saveActiveProfileBoosterConfig,
  hydrateProfiles,
  getProfilesState,
  replaceGameSettings,
  persistProfilesState,
  addProfilesListener,
} from "./profile-manager";
import { getDefaultBoosterConfig } from "./default-config";
import { getRegisteredGameSchemaVersion } from "./migrations";
import { loadVideoUrls } from "../video/video-loader";
import {
  BoosterConfigSchema,
  OldConfigSchema,
} from "../../schemas";
import { type } from "arktype";
import { env } from "./env";
import { ok, err, type Result, type ValidationError } from "../result";

import type { BoosterConfig, OldConfig } from "../../types";

const GOOGLE_DRIVE_DEFAULT_FOLDER = env.VITE_GOOGLE_DRIVE_DEFAULT_FOLDER ?? "";

const SITE_DEFAULT_URL = env.VITE_SITE_DEFAULT_UTL ?? "";

type ConfigChangeListener = (config: BoosterConfig) => void;
const listeners: ConfigChangeListener[] = [];

export const defaultConfig = getDefaultBoosterConfig();
import { writable } from 'svelte/store';
export const configStore = writable<BoosterConfig>({ ...defaultConfig });

let isConfigInitialized = false;

let appConfig: BoosterConfig = { ...defaultConfig };

export function addConfigListener(callback: ConfigChangeListener): () => void {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

function notifyConfigListeners(): void {
  const newConfig = { ...appConfig };
  listeners.forEach((listener) => listener(newConfig));
  configStore.set(newConfig);
}

export async function updateConfig(updates: Partial<BoosterConfig>): Promise<BoosterConfig> {
  if (updates.video) {
    if (updates.video.googleDriveFolderUrl === "") {
      updates.video.googleDriveFolderUrl = GOOGLE_DRIVE_DEFAULT_FOLDER;
    }
  }

  const candidate = deepMerge({ ...appConfig }, updates);

  // validation לפני שמירה — חוסם נתונים לא תקינים מהטופס או מקוד חיצוני
  const result = BoosterConfigSchema(candidate);
  if (result instanceof type.errors) {
    console.error("updateConfig: config לא תקין, לא נשמר:", result.summary);
    throw new Error(`Invalid config: ${result.summary}`);
  }

  appConfig = result;

  if (appConfig.rewardType === "video") {
    await setVideosUrls(appConfig);
  }

  syncActiveProfileSnapshot();
  notifyConfigListeners();

  return appConfig;
}

export async function tempConfig(updates: Partial<BoosterConfig>) {
  if (updates.video) {
    if (updates.video.googleDriveFolderUrl === "") {
      updates.video.googleDriveFolderUrl = GOOGLE_DRIVE_DEFAULT_FOLDER;
    }
  }

  if (updates.booster) {
    if (updates.booster.siteUrl === "") {
      updates.booster.siteUrl = SITE_DEFAULT_URL;
    }
  }

  const tempCfg = deepMerge({ ...appConfig }, updates);

  if (appConfig.rewardType === "video") {
    await setVideosUrls(appConfig);
  }

  return tempCfg;
}

async function setVideosUrls(systemConfig: BoosterConfig) {
  const videos = await loadVideoUrls(systemConfig);
  appConfig.video.videos = videos;
}

/** @deprecated ההגדרות נטענות מ-state הפרופילים; מפתח המראה הוסר. */
export function loadConfigFromStorage(): boolean {
  let stored = false;
  try { stored = localStorage.getItem('learn-booster-profiles:v1') !== null; } catch { return false; }
  hydrateProfiles();
  const active = getActiveProfile();
  if (active) { appConfig = cloneBoosterConfig(active.boosterConfig); notifyConfigListeners(); }
  return stored;
}

/** @deprecated שומר רק את state הפרופילים, ללא כתיבה למפתח המראה. */
export function saveConfigToStorage(): boolean {
  hydrateProfiles(appConfig);
  syncActiveProfileSnapshot();
  return persistProfilesState().isOk();
}

export function resetConfig(): void {
  appConfig = { ...defaultConfig };
  notifyConfigListeners();
}

export async function initializeConfig(): Promise<BoosterConfig> {
  resetConfig();

  // migration מ-OldConfig אם window.config מכיל פורמט ישן
  if (window.config) {
    const oldResult = OldConfigSchema(window.config);
    if (!(oldResult instanceof type.errors)) {
      const migrated = migrateOldConfig(oldResult);
      appConfig = deepMerge({ ...appConfig }, migrated);
    }
  }

  await initializeProfiles(appConfig);
  const activeProfile = getActiveProfile();
  if (activeProfile) {
    appConfig = cloneBoosterConfig(activeProfile.boosterConfig);
  }

  if (appConfig.rewardType === "video") {
    await setVideosUrls(appConfig);
  }

  appConfig = {
    ...appConfig, appVersion: pkg.version, envVals: {
      ...getEnvVals()
    }
  };

  isConfigInitialized = true;

  syncActiveProfileSnapshot();
  notifyConfigListeners();

  return { ...appConfig };
}

export function getRandomVideo():
  | { url: string; mimeType: string }
  | undefined {
  const videos = appConfig.video.videos;
  if (videos.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * videos.length);
  return videos[randomIndex];
}

export function getAllConfig(): Readonly<BoosterConfig> {
  if (!isConfigInitialized) {
    throw new Error(
      "מערכת ההגדרות לא אותחלה. יש לקרוא ל-initializeConfig לפני השימוש ב-getAllConfig",
    );
  }

  return Object.freeze(structuredClone(appConfig));
}

/** @deprecated השתמשו ב-defineGameSettings; עטיפת קריאה להגדרות הכלליות. */
export function getGameSettings<T = unknown>(gameId: string): T | undefined {
  hydrateProfiles();
  return getProfilesState().generalGameSettings[gameId]?.data as T | undefined;
}

/** @deprecated החלפה מלאה ב-scope הכללי; לשימוש חדש defineGameSettings. */
export async function updateGameSettings<T = unknown>(
  gameId: string, settings: T,
): Promise<Result<BoosterConfig, ValidationError>> {
  hydrateProfiles();
  const existing = getProfilesState().generalGameSettings[gameId];
  const schemaVersion = getRegisteredGameSchemaVersion(gameId) ?? existing?.schemaVersion ?? 1;
  const saved = replaceGameSettings(gameId, { schemaVersion, data: settings });
  if (saved.isErr()) return err(saved.error);
  notifyConfigListeners();
  return ok(appConfig);
}

/** @deprecated הרשמה לשכבה הכללית; לשימוש חדש settings.subscribe. */
export function subscribeGameSettings<T = unknown>(
  gameId: string, callback: (settings: T | undefined) => void,
): () => void {
  let last = JSON.stringify(getGameSettings<T>(gameId));
  callback(getGameSettings<T>(gameId));
  return addProfilesListener(() => {
    const current = getGameSettings<T>(gameId);
    const serialized = JSON.stringify(current);
    if (serialized !== last) { last = serialized; callback(current); }
  });
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      key in target
    ) {
      deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else if (typeof target === "object" && target !== null) {
      target[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }
  return target;
}

function cloneBoosterConfig(config: BoosterConfig): BoosterConfig {
  return typeof structuredClone === "function"
    ? structuredClone(config)
    : JSON.parse(JSON.stringify(config));
}

function syncActiveProfileSnapshot(): void {
  try {
    saveActiveProfileBoosterConfig(appConfig);
  } catch (error) {
    console.warn("Unable to sync active profile config:", error);
  }
}

function getEnvVals() {
  const hostname = window.location.hostname,
    fullPath = window.location.href,
    isIframe = window.self !== window.top,
    selfUrl = import.meta.url,
    isDevServer = import.meta.env.DEV as boolean,
    devMode = import.meta.env.DEV,
    deployServer = env.VITE_PRJ_DOMAIN ?? "",
    isDeployServer = (hostname === deployServer);

  return {
    hostname, fullPath, isIframe,
    selfUrl, isDevServer, devMode,
    deployServer, isDeployServer,
    /** @deprecated gingim-specific, always false */
    isDirectToGamePage: false,
    /** @deprecated gingim-specific, always false */
    isGingim: false,
    /** @deprecated gingim-specific, always false */
    isGamePage: false,
    /** @deprecated gingim-specific, always false */
    isBoosterIframe: false,
    /** @deprecated gingim-specific, always false */
    isGamesListPage: false,
    /** @deprecated gingim-specific, always false */
    isGingimHomepage: false,
  };
}

function migrateOldConfig(old: OldConfig): Partial<BoosterConfig> {
  return {
    rewardType: old.mode === "app" ? "app" : "video",
    rewardDisplayDurationMs: old.videoDisplayTimeInMS,
    turnsPerReward: old.turnsPerVideo,
    video: {
      videos: old.videoUrls.map(url => ({ url, mimeType: "video/mp4" })),
      source: old.videoSource,
      googleDriveFolderUrl: old.googleDriveFolderUrl,
      hideProgressBar: old.hideVideoProgress,
    },
    app: { packageName: old.appName },
    system: old.systemConfig,
  };
}

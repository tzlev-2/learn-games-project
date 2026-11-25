// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, tick, unmount } from "svelte";
import { get } from "svelte/store";
import { type } from "arktype";
import GameSettingsPageFixture from "./fixtures/GameSettingsPageFixture.svelte";
import SettingsForm from "../src/ui/components/SettingsForm.svelte";
import Settings from "../src/ui/components/Settings.svelte";
import { defineGameSettings } from "../src/lib/config/game-settings";
import * as profiles from "../src/lib/config/profile-manager";
import * as configManager from "../src/lib/config/config-manager";
import { getDefaultBoosterConfig } from "../src/lib/config/default-config";
import { language } from "../src/ui/language";

vi.mock("../src/lib/fully-kiosk/get-app-list", () => ({ getAppsList: async () => [] }));

let instance: ReturnType<typeof mount> | undefined;
const text = language.profiles;
const settingsText = language.settings;
const config = { ...structuredClone(getDefaultBoosterConfig()), rewardType: "site" as const };

function target() {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
}

function button(label: string): HTMLButtonElement {
    const found = [...document.querySelectorAll("button")].find(
        (element) => element.textContent?.trim() === label,
    );
    if (!found) throw new Error(`Button missing: ${label}`);
    return found;
}

async function settle() {
    await tick();
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushSync();
}

function changeInput(selector: string, value: string) {
    const input = document.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    flushSync();
}

function toggleProfiles(enabled: boolean) {
    const input = document.querySelector<HTMLInputElement>(".profile-bar input")!;
    input.checked = enabled;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    flushSync();
}

beforeEach(async () => {
    localStorage.clear();
    profiles._resetProfilesStateForTesting();
    profiles.hydrateProfiles(config);
    await configManager.updateConfig(structuredClone(config));
});

afterEach(async () => {
    if (instance) await unmount(instance);
    instance = undefined;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
});

describe("GameSettingsPage", () => {
    function renderPage() {
        const settings = defineGameSettings({
            gameId: "settings-page-test",
            defaults: { cooldownMs: 3000, choices: 4 },
            schema: type({ cooldownMs: "number >= 0", choices: "number >= 1" }),
            currentVersion: 1,
            migrate: (value) => value,
        });
        instance = mount(GameSettingsPageFixture, {
            target: target(),
            props: { settings, config: structuredClone(config) },
        });
        flushSync();
        return settings;
    }

    it("seeds the booster form from the hydrated active profile before the config store is ready", async () => {
        profiles.updateProfile(profiles.getProfilesState().activeProfileId!, {
            boosterConfig: { ...structuredClone(config), turnsPerReward: 9 },
        });
        expect(get(configManager.configStore).turnsPerReward).toBe(1);
        renderPage();
        expect(document.querySelector<HTMLInputElement>("#turnsPerVideo")?.value).toBe("9");
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(9);
    });

    it("keeps the toggle reachable while disabled and changes scope without writing settings", async () => {
        const settings = renderPage();
        expect(document.querySelectorAll("main")).toHaveLength(1);
        expect(document.querySelector(".game-settings-page")?.tagName).toBe("DIV");
        expect(document.querySelectorAll(".profile-bar")).toHaveLength(1);
        expect(document.querySelector('[role="radiogroup"]')).toBeNull();
        expect(document.querySelector("[data-scope]")?.textContent).toBe("general");
        toggleProfiles(true);
        await settle();
        const before = JSON.stringify(profiles.getProfilesState().generalGameSettings);
        button(settingsText.profile("Default Profile")).click();
        flushSync();
        expect(document.querySelector("[data-scope]")?.textContent).toBe("profile");
        expect(JSON.stringify(profiles.getProfilesState().generalGameSettings)).toBe(before);
        document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
        flushSync();
        expect(settings.getOverride()).toEqual({ cooldownMs: 7000 });
        expect(settings.getGeneral()).toEqual({ cooldownMs: 3000, choices: 4 });
        expect(document.body.textContent).toContain(settingsText.overridden);
        toggleProfiles(false);
        await settle();
        expect(document.querySelector("[data-scope]")?.textContent).toBe("general");
        expect(settings.get().cooldownMs).toBe(7000);
        expect(settings.getGeneral().cooldownMs).toBe(3000);
        expect(document.querySelector(".profile-bar input")).not.toBeNull();
    });

    it("resets one field and all overrides without changing general settings", async () => {
        const settings = renderPage();
        toggleProfiles(true);
        await settle();
        settings.set({ cooldownMs: 8000, choices: 6 }, "profile");
        flushSync();
        button(settingsText.clearField).click();
        flushSync();
        expect(settings.get()).toEqual({ cooldownMs: 3000, choices: 6 });
        expect(settings.getOverride()).toEqual({ choices: 6 });
        button(settingsText.clearAll).click();
        flushSync();
        expect(settings.getOverride()).toEqual({});
        expect(settings.getGeneral()).toEqual({ cooldownMs: 3000, choices: 4 });
    });

    it("synchronizes the booster draft on profile apply and prevents a pending save leaking to that profile", async () => {
        const settings = renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: { ...structuredClone(config), turnsPerReward: 8 },
        });
        settings.set({ cooldownMs: 5000 }, "general");
        changeInput("#turnsPerVideo", "5");
        expect(document.body.textContent).toContain(text.unsaved);
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
        const select = document.querySelector<HTMLSelectElement>(".profile-bar select")!;
        select.value = other.id;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        button(text.apply).click();
        await settle();
        expect(confirm).toHaveBeenCalledWith(text.confirmSwitch);
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        confirm.mockReturnValue(true);
        select.value = other.id;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        button(text.apply).click();
        await settle();
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(document.querySelector<HTMLInputElement>("#turnsPerVideo")?.value).toBe("8");
        expect(settings.getGeneral().cooldownMs).toBe(5000);
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(profiles.getProfilesState().profiles[other.id].boosterConfig.turnsPerReward).toBe(8);
        expect(get(configManager.configStore).turnsPerReward).toBe(8);
    });
});

describe("legacy Settings and SettingsForm profile controls", () => {
    it("shows profiles by default, saves duration drafts, creates and deletes profiles", async () => {
        profiles.setProfilesUiEnabled(true);
        instance = mount(Settings, {
            target: target(),
            props: { config: structuredClone(config), handleShowVideo: () => {} },
        });
        flushSync();
        expect(document.querySelectorAll(".profile-bar")).toHaveLength(1);
        changeInput("#displayTime", "37");
        expect(profiles.getProfilesState().dirtyBoosterConfig?.rewardDisplayDurationMs).toBe(37000);
        button(text.save).click();
        await settle();
        const firstId = profiles.getProfilesState().activeProfileId!;
        expect(
            profiles.getProfilesState().profiles[firstId].boosterConfig.rewardDisplayDurationMs,
        ).toBe(37000);
        expect(profiles.getProfilesState().dirtyBoosterConfig).toBeNull();
        vi.spyOn(window, "prompt").mockReturnValue("Created");
        button(text.create).click();
        await settle();
        const created = profiles.getProfilesState();
        expect(created.profiles[created.activeProfileId!].name).toBe("Created");
        expect(
            created.profiles[created.activeProfileId!].boosterConfig.rewardDisplayDurationMs,
        ).toBe(37000);
        expect(button(text.delete).disabled).toBe(true);
        const select = document.querySelector<HTMLSelectElement>(".profile-bar select")!;
        select.value = firstId;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        flushSync();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        button(text.delete).click();
        await settle();
        expect(profiles.getProfilesState().profiles[firstId]).toBeUndefined();
    });

    it("supports showProfiles=false without changing the booster fields", () => {
        instance = mount(SettingsForm, {
            target: target(),
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
                showProfiles: false,
            },
        });
        flushSync();
        expect(document.querySelector(".profile-bar")).toBeNull();
        expect(document.querySelector("#turnsPerVideo")).not.toBeNull();
    });

    it("auto-saves changes to the reward duration in embedded mode", async () => {
        instance = mount(SettingsForm, {
            target: target(),
            props: { config: structuredClone(config), handleShowVideo: () => {}, embedded: true },
        });
        flushSync();
        changeInput("#displayTime", "43");
        await vi.waitFor(
            () => {
                const active = profiles.getActiveProfile();
                expect(active?.boosterConfig.rewardDisplayDurationMs).toBe(43000);
            },
            { timeout: 2000 },
        );
    });

    it("retains the dirty draft when saving fails", async () => {
        profiles.setProfilesUiEnabled(true);
        instance = mount(SettingsForm, {
            target: target(),
            props: { config: structuredClone(config), handleShowVideo: () => {} },
        });
        flushSync();
        changeInput("#turnsPerVideo", "6");
        vi.spyOn(configManager, "updateConfig").mockRejectedValueOnce(new Error("Save failed"));
        vi.spyOn(console, "error").mockImplementation(() => {});
        button(text.save).click();
        await settle();
        expect(profiles.getProfilesState().dirtyBoosterConfig?.turnsPerReward).toBe(6);
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            config.turnsPerReward,
        );
    });
});

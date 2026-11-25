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

vi.mock("../src/lib/fully-kiosk/get-app-list", () => ({
    getAppsList: async () => [],
}));

let instance: ReturnType<typeof mount> | undefined;
const text = language.profiles;
const settingsText = language.settings;
const config = {
    ...structuredClone(getDefaultBoosterConfig()),
    rewardType: "site" as const,
};

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
    const input =
        document.querySelector<HTMLInputElement>(".profile-bar input")!;
    input.checked = enabled;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    flushSync();
}

function selectProfile(id: string) {
    const select = document.querySelector<HTMLSelectElement>(
        ".profile-bar select",
    )!;
    select.value = id;
    select.dispatchEvent(new Event("change", { bubbles: true }));
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
    vi.useRealTimers();
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
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")?.value,
        ).toBe("9");
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            9,
        );
    });

    it("keeps the toggle reachable while disabled and changes scope without writing settings", async () => {
        const settings = renderPage();
        expect(document.querySelectorAll("main")).toHaveLength(1);
        expect(document.querySelector(".game-settings-page")?.tagName).toBe(
            "DIV",
        );
        expect(document.querySelectorAll(".profile-bar")).toHaveLength(1);
        expect(document.querySelector('[role="radiogroup"]')).toBeNull();
        expect(document.querySelector("[data-scope]")?.textContent).toBe(
            "general",
        );
        toggleProfiles(true);
        await settle();
        const before = JSON.stringify(
            profiles.getProfilesState().generalGameSettings,
        );
        button(settingsText.profile("Default Profile")).click();
        flushSync();
        expect(document.querySelector("[data-scope]")?.textContent).toBe(
            "profile",
        );
        expect(
            JSON.stringify(profiles.getProfilesState().generalGameSettings),
        ).toBe(before);
        document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
        flushSync();
        expect(settings.getOverride()).toEqual({ cooldownMs: 7000 });
        expect(settings.getGeneral()).toEqual({ cooldownMs: 3000, choices: 4 });
        expect(document.body.textContent).toContain(settingsText.overridden);
        toggleProfiles(false);
        await settle();
        expect(document.querySelector("[data-scope]")?.textContent).toBe(
            "general",
        );
        expect(settings.get().cooldownMs).toBe(7000);
        expect(settings.getGeneral().cooldownMs).toBe(3000);
        expect(document.querySelector(".profile-bar input")).not.toBeNull();
    });

    // BRIEF.md §S3.2.3: בחירת פרופיל ו-scope בראש; ניהול רק בסוף כדי שההגדרות יתחילו מיד.
    it("keeps management last and only shows the slim profile selector when enabled", async () => {
        renderPage();
        const panel = document.querySelector(".settings-panel")!;
        const management = document.querySelector(".management-panel")!;
        expect(panel.lastElementChild).toBe(management);
        expect(document.querySelector(".selection-panel")).toBeNull();
        expect(
            management.querySelector('input[type="checkbox"]'),
        ).not.toBeNull();
        expect(management.querySelector("button")).toBeNull();
        expect(document.querySelector("header h1")?.textContent).toContain(
            settingsText.title,
        );
        expect(
            document.querySelector("header")?.classList.contains("card"),
        ).toBe(false);
        toggleProfiles(true);
        await settle();
        const selection = document.querySelector(".selection-panel")!;
        expect(panel.children[1]).toBe(selection);
        expect(selection.querySelector("select")).not.toBeNull();
        expect(selection.querySelector('[role="radiogroup"]')).not.toBeNull();
        expect(selection.querySelector('input[type="checkbox"]')).toBeNull();
        expect(selection.textContent).not.toContain(text.create);
        expect(selection.textContent).not.toContain(text.delete);
        expect(management.contains(button(text.create))).toBe(true);
        expect(management.contains(button(text.delete))).toBe(true);
        expect(panel.lastElementChild).toBe(management);
        expect(document.querySelector(".game-section .card")).toBeNull();
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

    it("saves the booster draft before immediately activating a selected profile", async () => {
        const settings = renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: { ...structuredClone(config), turnsPerReward: 8 },
        });
        const originalUpdate = configManager.updateConfig;
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const save = vi
            .spyOn(configManager, "updateConfig")
            .mockImplementationOnce(async (next) => {
                await gate;
                return originalUpdate(next);
            });
        const activate = vi.spyOn(profiles, "setActiveProfile");
        const confirm = vi.spyOn(window, "confirm");
        settings.set({ cooldownMs: 5000 }, "general");
        changeInput("#turnsPerVideo", "5");
        selectProfile(other.id);
        await settle();
        expect(save).toHaveBeenCalledWith(
            expect.objectContaining({ turnsPerReward: 5 }),
        );
        expect(activate).not.toHaveBeenCalled();
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        expect(
            document.querySelector<HTMLSelectElement>(".profile-bar select")!
                .disabled,
        ).toBe(true);
        changeInput("#turnsPerVideo", "6");
        release();
        await settle();
        expect(
            profiles.getProfilesState().profiles[originalId].boosterConfig
                .turnsPerReward,
        ).toBe(6);
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")?.value,
        ).toBe("8");
        expect(
            document.querySelector(".booster-section h2")?.textContent,
        ).toContain(settingsText.boosterProfile("Second"));
        expect(settings.getGeneral().cooldownMs).toBe(5000);
        expect(confirm).not.toHaveBeenCalled();
        expect(document.body.textContent).not.toContain(text.unsaved);
        expect(
            [...document.querySelectorAll("button")].some(
                (element) => element.textContent?.trim() === text.apply,
            ),
        ).toBe(false);
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(
            profiles.getProfilesState().profiles[other.id].boosterConfig
                .turnsPerReward,
        ).toBe(8);
        expect(get(configManager.configStore).turnsPerReward).toBe(8);
    });

    it("retains the active profile and draft on failed save, then allows retry", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        const activate = vi.spyOn(profiles, "setActiveProfile");
        vi.spyOn(configManager, "updateConfig").mockRejectedValueOnce(
            new Error("Save failed"),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});
        changeInput("#turnsPerVideo", "6");
        selectProfile(other.id);
        await settle();
        expect(activate).not.toHaveBeenCalled();
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        expect(
            document.querySelector<HTMLSelectElement>(".profile-bar select")!
                .value,
        ).toBe(originalId);
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")!.value,
        ).toBe("6");
        expect(
            profiles.getProfilesState().dirtyBoosterConfig?.turnsPerReward,
        ).toBe(6);
        expect(document.querySelector('[role="alert"]')).not.toBeNull();
        selectProfile(other.id);
        await settle();
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(
            profiles.getProfilesState().profiles[originalId].boosterConfig
                .turnsPerReward,
        ).toBe(6);
    });

    it("does not switch or report saved when profile storage fails", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        const originalSetItem = Storage.prototype.setItem;
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(
            function (key, value) {
                if (key === "learn-booster-profiles:v1")
                    throw new Error("Quota");
                originalSetItem.call(this, key, value);
            },
        );
        vi.spyOn(console, "warn").mockImplementation(() => {});
        changeInput("#turnsPerVideo", "6");
        selectProfile(other.id);
        await settle();
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")!.value,
        ).toBe("6");
        expect(document.querySelector('[role="alert"]')).not.toBeNull();
        expect(document.querySelector(".saved")?.textContent).toBe("");
        expect(
            profiles.getProfilesState().dirtyBoosterConfig?.turnsPerReward,
        ).toBe(6);
    });

    it("flushes newer draft edits after an autosave already in flight before switching", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: { ...structuredClone(config), turnsPerReward: 8 },
        });
        const originalUpdate = configManager.updateConfig;
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        vi.spyOn(configManager, "updateConfig").mockImplementationOnce(
            async (next) => {
                await gate;
                return originalUpdate(next);
            },
        );
        vi.useFakeTimers();
        changeInput("#turnsPerVideo", "5");
        await vi.advanceTimersByTimeAsync(1001);
        changeInput("#turnsPerVideo", "6");
        selectProfile(other.id);
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        release();
        await vi.advanceTimersByTimeAsync(0);
        flushSync();
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(
            profiles.getProfilesState().profiles[originalId].boosterConfig
                .turnsPerReward,
        ).toBe(6);
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")!.value,
        ).toBe("8");
        vi.useRealTimers();
    });

    it("saves before creating a profile and deletes the active profile after activating its replacement", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const firstId = profiles.getProfilesState().activeProfileId!;
        changeInput("#turnsPerVideo", "4");
        vi.spyOn(window, "prompt").mockReturnValue("Created");
        button(text.create).click();
        await settle();
        const createdId = profiles.getProfilesState().activeProfileId!;
        expect(createdId).not.toBe(firstId);
        expect(
            profiles.getProfilesState().profiles[firstId].boosterConfig
                .turnsPerReward,
        ).toBe(4);
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            4,
        );
        const activate = vi.spyOn(profiles, "setActiveProfile");
        const remove = vi.spyOn(profiles, "deleteProfile");
        vi.spyOn(window, "confirm").mockReturnValue(true);
        button(text.delete).click();
        await settle();
        expect(activate).toHaveBeenCalledWith(firstId);
        expect(remove).toHaveBeenCalledWith(createdId);
        expect(activate.mock.invocationCallOrder[0]).toBeLessThan(
            remove.mock.invocationCallOrder[0],
        );
        expect(profiles.getProfilesState().activeProfileId).toBe(firstId);
        expect(profiles.getProfilesState().profiles[createdId]).toBeUndefined();
        expect(button(text.delete).disabled).toBe(true);
    });

    it("does not activate or delete any profile when saving before deletion fails, and permits retry", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        const activate = vi.spyOn(profiles, "setActiveProfile");
        const remove = vi.spyOn(profiles, "deleteProfile");
        vi.spyOn(configManager, "updateConfig").mockRejectedValueOnce(
            new Error("Save failed"),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(window, "confirm").mockReturnValue(true);
        changeInput("#turnsPerVideo", "6");
        expect(button(text.delete).disabled).toBe(false);
        button(text.delete).click();
        await settle();
        expect(activate).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        expect(profiles.getProfilesState().profiles[originalId]).toBeDefined();
        expect(profiles.getProfilesState().profiles[other.id]).toBeDefined();
        expect(
            document.querySelector<HTMLInputElement>("#turnsPerVideo")!.value,
        ).toBe("6");
        expect(
            profiles.getProfilesState().dirtyBoosterConfig?.turnsPerReward,
        ).toBe(6);
        expect(document.querySelector('[role="alert"]')).not.toBeNull();
        button(text.delete).click();
        await settle();
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(
            profiles.getProfilesState().profiles[originalId],
        ).toBeUndefined();
    });

    it("does not announce a save for scope changes or switching an unchanged profile", async () => {
        renderPage();
        toggleProfiles(true);
        await settle();
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        button(settingsText.profile("Default Profile")).click();
        flushSync();
        expect(document.querySelector(".saved")?.textContent).toBe("");
        selectProfile(other.id);
        await settle();
        expect(profiles.getProfilesState().activeProfileId).toBe(other.id);
        expect(document.querySelector(".saved")?.textContent).toBe("");
    });

    it("keeps game scope within the profile card and saves booster only to the active profile", async () => {
        const settings = renderPage();
        toggleProfiles(true);
        await settle();
        const originalId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        expect(
            document.querySelector('.profile-bar [role="radiogroup"]'),
        ).not.toBeNull();
        changeInput("#turnsPerVideo", "7");
        button(settingsText.profile("Default Profile")).click();
        flushSync();
        await vi.waitFor(
            () =>
                expect(
                    profiles.getActiveProfile()?.boosterConfig.turnsPerReward,
                ).toBe(7),
            { timeout: 2000 },
        );
        expect(profiles.getProfilesState().activeProfileId).toBe(originalId);
        expect(
            profiles.getProfilesState().profiles[other.id].boosterConfig
                .turnsPerReward,
        ).toBe(config.turnsPerReward);
        expect(settings.getGeneral()).toEqual({ cooldownMs: 3000, choices: 4 });
        expect(settings.getOverride()).toEqual({});
    });

    it("does not retry or announce a game write when profile storage fails only once", () => {
        const settings = renderPage();
        const before = localStorage.getItem("learn-booster-profiles:v1");
        const originalSetItem = Storage.prototype.setItem;
        let profileWrites = 0;
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(
            function (key, value) {
                if (
                    key === "learn-booster-profiles:v1" &&
                    ++profileWrites === 1
                )
                    throw new Error("Quota once");
                originalSetItem.call(this, key, value);
            },
        );
        document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
        flushSync();
        expect(settings.get().cooldownMs).toBe(7000);
        expect(profileWrites).toBe(1);
        expect(localStorage.getItem("learn-booster-profiles:v1")).toBe(before);
        expect(document.querySelector(".saved")?.textContent).toBe("");
    });

    it("never adds a persistence write from a settings subscription and announces only explicit save results", () => {
        const settings = renderPage();
        const writes = vi.spyOn(Storage.prototype, "setItem");
        settings.set({ cooldownMs: 8000 }, "general");
        flushSync();
        expect(
            writes.mock.calls.filter(
                ([key]) => key === "learn-booster-profiles:v1",
            ),
        ).toHaveLength(1);
        expect(document.querySelector(".saved")?.textContent).toBe("");
        writes.mockClear();
        document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
        flushSync();
        expect(
            writes.mock.calls.filter(
                ([key]) => key === "learn-booster-profiles:v1",
            ),
        ).toHaveLength(1);
        expect(document.querySelector(".saved")?.textContent).toBe(
            settingsText.saved,
        );
    });

    it("announces a game save for two seconds, then a booster save", async () => {
        renderPage();
        vi.useFakeTimers();
        document.querySelector<HTMLButtonElement>("[data-edit]")!.click();
        flushSync();
        expect(
            document.querySelector('[role="status"].saved')?.textContent,
        ).toBe(settingsText.saved);
        await vi.advanceTimersByTimeAsync(2001);
        flushSync();
        expect(document.querySelector(".saved")?.textContent).toBe("");
        changeInput("#turnsPerVideo", "3");
        await vi.advanceTimersByTimeAsync(1001);
        flushSync();
        expect(document.querySelector(".saved")?.textContent).toBe(
            settingsText.saved,
        );
        await vi.advanceTimersByTimeAsync(2001);
        flushSync();
        expect(document.querySelector(".saved")?.textContent).toBe("");
        vi.useRealTimers();
    });
});

describe("legacy Settings and SettingsForm profile controls", () => {
    it("shows profiles by default, saves duration drafts, creates and deletes profiles", async () => {
        profiles.setProfilesUiEnabled(true);
        instance = mount(Settings, {
            target: target(),
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
            },
        });
        flushSync();
        expect(document.querySelectorAll(".profile-bar")).toHaveLength(1);
        expect(document.querySelector(".settings-form.embedded")).toBeNull();
        expect(document.querySelector(".profile-bar.panel")).toBeNull();
        changeInput("#displayTime", "37");
        expect(
            profiles.getProfilesState().dirtyBoosterConfig
                ?.rewardDisplayDurationMs,
        ).toBe(37000);
        button(text.save).click();
        await settle();
        const firstId = profiles.getProfilesState().activeProfileId!;
        expect(
            profiles.getProfilesState().profiles[firstId].boosterConfig
                .rewardDisplayDurationMs,
        ).toBe(37000);
        expect(profiles.getProfilesState().dirtyBoosterConfig).toBeNull();
        vi.spyOn(window, "prompt").mockReturnValue("Created");
        button(text.create).click();
        await settle();
        const created = profiles.getProfilesState();
        expect(created.profiles[created.activeProfileId!].name).toBe("Created");
        expect(
            created.profiles[created.activeProfileId!].boosterConfig
                .rewardDisplayDurationMs,
        ).toBe(37000);
        expect(button(text.delete).disabled).toBe(true);
        const select = document.querySelector<HTMLSelectElement>(
            ".profile-bar select",
        )!;
        select.value = firstId;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        flushSync();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        button(text.delete).click();
        await settle();
        expect(profiles.getProfilesState().profiles[firstId]).toBeUndefined();
    });

    it("keeps manual profile apply and save-and-close in nonembedded mode", async () => {
        profiles.setProfilesUiEnabled(true);
        const onClose = vi.fn();
        const firstId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        instance = mount(SettingsForm, {
            target: target(),
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
                onClose,
            },
        });
        flushSync();
        selectProfile(other.id);
        expect(profiles.getProfilesState().activeProfileId).toBe(firstId);
        changeInput("#turnsPerVideo", "4");
        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            config.turnsPerReward,
        );
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
        button(text.apply).click();
        await settle();
        expect(confirm).toHaveBeenCalledWith(text.confirmSwitch);
        expect(profiles.getProfilesState().activeProfileId).toBe(firstId);
        vi.useFakeTimers();
        button("שמור וסגור").click();
        await vi.advanceTimersByTimeAsync(1501);
        flushSync();
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            4,
        );
        expect(onClose).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });

    it("keeps standalone embedded profile selection manual outside GameSettingsPage", () => {
        profiles.setProfilesUiEnabled(true);
        const firstId = profiles.getProfilesState().activeProfileId!;
        const other = profiles.createProfile({
            name: "Second",
            boosterConfig: structuredClone(config),
        });
        instance = mount(SettingsForm, {
            target: target(),
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
                embedded: true,
            },
        });
        flushSync();
        selectProfile(other.id);
        expect(profiles.getProfilesState().activeProfileId).toBe(firstId);
        expect(button(text.apply)).toBeDefined();
        expect(button(text.save)).toBeDefined();
        expect(
            document.querySelector(".settings-form.embedded"),
        ).not.toBeNull();
        expect(document.querySelector(".profile-bar.panel")).not.toBeNull();
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
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
                embedded: true,
            },
        });
        flushSync();
        changeInput("#displayTime", "43");
        await vi.waitFor(
            () => {
                const active = profiles.getActiveProfile();
                expect(active?.boosterConfig.rewardDisplayDurationMs).toBe(
                    43000,
                );
            },
            { timeout: 2000 },
        );
        await settle();
        expect(document.body.textContent).toContain("הגדרות נשמרו בהצלחה");
    });

    it("retains the dirty draft when saving fails", async () => {
        profiles.setProfilesUiEnabled(true);
        instance = mount(SettingsForm, {
            target: target(),
            props: {
                config: structuredClone(config),
                handleShowVideo: () => {},
            },
        });
        flushSync();
        changeInput("#turnsPerVideo", "6");
        vi.spyOn(configManager, "updateConfig").mockRejectedValueOnce(
            new Error("Save failed"),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});
        button(text.save).click();
        await settle();
        expect(
            profiles.getProfilesState().dirtyBoosterConfig?.turnsPerReward,
        ).toBe(6);
        expect(profiles.getActiveProfile()?.boosterConfig.turnsPerReward).toBe(
            config.turnsPerReward,
        );
    });
});

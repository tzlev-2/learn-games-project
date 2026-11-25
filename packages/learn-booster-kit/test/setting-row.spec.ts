// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { type } from "arktype";
import SettingRowFixture from "./fixtures/SettingRowFixture.svelte";
import { defineGameSettings } from "../src/lib/config/game-settings";
import * as profiles from "../src/lib/config/profile-manager";
import { language } from "../src/ui/language";

let instance: ReturnType<typeof mount>;
beforeEach(() => {
    localStorage.clear();
    profiles._resetProfilesStateForTesting();
    profiles.hydrateProfiles();
    profiles.setProfilesUiEnabled(true);
});
afterEach(async () => {
    await unmount(instance);
    document.body.innerHTML = "";
    vi.restoreAllMocks();
});

function render(withSettings = true) {
    const settings = defineGameSettings({
        gameId: "row-test",
        defaults: { enabled: false },
        schema: type({ enabled: "boolean" }),
        currentVersion: 1,
        migrate: (data) => data,
    });
    instance = mount(SettingRowFixture, {
        target: document.body,
        props: { settings: withSettings ? settings : undefined },
    });
    flushSync();
    return settings;
}

describe("SettingRow", () => {
    it("renders a named group, description and generic control without a settings handle", () => {
        render(false);
        const row = document.querySelector('[role="group"]')!;
        expect(
            document.getElementById(row.getAttribute("aria-labelledby")!)
                ?.textContent,
        ).toBe("Enabled");
        expect(
            document.getElementById(row.getAttribute("aria-describedby")!)
                ?.textContent,
        ).toBe("Optional setting");
        expect(document.querySelector('input[type="checkbox"]')).not.toBeNull();
        expect(document.querySelector(".mark")).toBeNull();
    });
    it("keeps the control interactive, marks its override and resets only that field", () => {
        const settings = render();
        const control = document.querySelector<HTMLInputElement>("input")!;
        control.checked = true;
        control.dispatchEvent(new Event("change", { bubbles: true }));
        flushSync();
        expect(settings.getOverride()).toEqual({ enabled: true });
        expect(document.querySelector(".mark")?.textContent).toContain(
            language.settings.overridden,
        );
        document.querySelector<HTMLButtonElement>(".mark button")!.click();
        flushSync();
        expect(settings.getOverride()).toEqual({});
        expect(control.checked).toBe(false);
        expect(settings.getGeneral()).toEqual({ enabled: false });
        expect(document.querySelector(".mark")).toBeNull();
    });
    it("reports reset failures instead of suggesting a successful reset", () => {
        const settings = render();
        settings.set({ enabled: true }, "profile");
        flushSync();
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("Quota");
        });
        document.querySelector<HTMLButtonElement>(".mark button")!.click();
        flushSync();
        expect(document.querySelector('[role="alert"]')?.textContent).toBe(
            language.settings.resetError,
        );
    });
});

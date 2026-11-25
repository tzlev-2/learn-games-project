import { readable } from "svelte/store";
import type { GameSettingsHandle } from "../../lib/config/game-settings";

/** מחבר את התראות ההגדרות למינוי Svelte שמתנקה עם הרכיב. */
export function overrideKeysStore<T extends object>(settings: GameSettingsHandle<T>) {
    return readable<(keyof T)[]>(settings.overriddenKeys(), (set) =>
        settings.subscribe(() => set(settings.overriddenKeys())),
    );
}

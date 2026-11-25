<script lang="ts">
    import type {
        GameSettingsHandle,
        GameSettingsScope,
    } from "../../src/lib/config/game-settings";
    import { useGameSettingsSaveStatus } from "../../src/ui/components/GameSettingsPage.svelte";
    import SettingRow from "../../src/ui/components/SettingRow.svelte";

    let {
        scope,
        settings,
    }: {
        scope: GameSettingsScope;
        settings: GameSettingsHandle<{ cooldownMs: number; choices: number }>;
    } = $props();
    const reportSave = useGameSettingsSaveStatus();
</script>

<output data-scope>{scope}</output>
<SettingRow
    label="Cooldown"
    description="Cooldown description"
    key="cooldownMs"
    {settings}
>
    {#snippet control()}
        <button
            type="button"
            data-edit
            onclick={() =>
                reportSave(settings.set({ cooldownMs: 7000 }, scope))}
            >Edit</button
        >
    {/snippet}
</SettingRow>

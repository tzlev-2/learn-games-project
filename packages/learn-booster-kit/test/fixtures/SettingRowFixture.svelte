<script lang="ts">
    import { onMount } from "svelte";
    import type { GameSettingsHandle } from "../../src/lib/config/game-settings";
    import SettingRow from "../../src/ui/components/SettingRow.svelte";
    let { settings }: { settings?: GameSettingsHandle<{ enabled: boolean }> } =
        $props();
    let enabled = $state(false);
    onMount(() =>
        settings?.subscribe((next) => {
            enabled = next.enabled;
        }),
    );
</script>

<SettingRow
    label="Enabled"
    description="Optional setting"
    key="enabled"
    {settings}
>
    {#snippet control()}
        <input
            type="checkbox"
            checked={enabled}
            aria-label="Enabled"
            onchange={(event) =>
                settings?.set(
                    { enabled: event.currentTarget.checked },
                    "profile",
                )}
        />
    {/snippet}
</SettingRow>

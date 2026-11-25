<script lang="ts">
    import type { Config } from "../../src/types";
    import type {
        GameSettingsHandle,
        GameSettingsScope,
    } from "../../src/lib/config/game-settings";
    import GameSettingsPage from "../../src/ui/components/GameSettingsPage.svelte";
    import GameSettingsControlsFixture from "./GameSettingsControlsFixture.svelte";
    import GameShell from "../../src/ui/shell/GameShell.svelte";

    let {
        settings,
        config,
    }: {
        settings: GameSettingsHandle<{ cooldownMs: number; choices: number }>;
        config: Config;
    } = $props();
</script>

<div style="height: 480px; background: #1e293b" data-theme="slate">
    <GameShell layout="fill" background="none">
        <div style="height: 100%; display: flex; flex-direction: column">
            <GameSettingsPage
                title="Settings fixture"
                {settings}
                {config}
                onBack={() => {}}
                handleShowVideo={() => {}}
            >
                {#snippet gameSection(scope: GameSettingsScope)}
                    <GameSettingsControlsFixture {scope} {settings} />
                {/snippet}
            </GameSettingsPage>
        </div>
    </GameShell>
</div>

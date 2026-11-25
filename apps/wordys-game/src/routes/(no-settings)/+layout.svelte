<script lang="ts">
	import { AdminGate, IconButton, SettingsIcon } from 'learn-booster-kit';
	import { goto } from '$app/navigation';
	import { language } from '$lib/services/language';

	let { children } = $props();

	const goToSettings = () => {
		goto('/admin/settings');
	};
</script>

<div id="no-settings-layout">
	<div class="absolute top-4 left-4 z-50">
		<!-- כפתור הגדרות מוגן (AdminGate חוסם תלמידים) -->
		<AdminGate onUnlock={() => goToSettings()}>
			<IconButton label={language.settingsLabel} variant="floating">
				{#snippet icon()}<SettingsIcon size={22} />{/snippet}
			</IconButton>
		</AdminGate>
	</div>

	{@render children()}
</div>


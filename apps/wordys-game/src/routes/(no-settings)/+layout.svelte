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
			<IconButton label={language.settingsLabel} class="wd-float-btn">
				{#snippet icon()}<SettingsIcon size={22} />{/snippet}
			</IconButton>
		</AdminGate>
	</div>

	{@render children()}
</div>

<style>
	/* כפתור צף: עיגול לבן-שקוף 48px עם צל, כמו במקור */
	:global(.wd-float-btn) {
		width: 3rem;
		height: 3rem;
		background-color: rgb(255 255 255 / 0.8);
		backdrop-filter: blur(4px);
		box-shadow:
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 4px 6px -4px rgb(0 0 0 / 0.1);
		color: #475569;
	}
	:global(.wd-float-btn:hover) {
		background-color: #ffffff;
		color: #0f172a;
	}
</style>

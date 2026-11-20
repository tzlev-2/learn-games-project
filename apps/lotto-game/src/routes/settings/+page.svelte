<script lang="ts">
	import SettingsControls from './_components/SettingsControls.svelte';
	import { goto } from '$app/navigation';
	import { Button } from 'learn-booster-kit';
	import { language } from '$lib/language';
</script>

<div class="settings-page" dir="rtl">
	<div class="settings-inner">
		<!-- Header -->
		<div class="header">
			<h1 class="title">{language.settingsPage.title}</h1>
			<Button color="secondary" class="lotto-back-button" onclick={() => goto('/')}>
				{language.settingsPage.backToGame}
			</Button>
		</div>

		<SettingsControls />
	</div>
</div>

<style type="text/postcss">
	@reference "tailwindcss";

	.settings-page {
		/* Layout */
		@apply w-full flex-1 h-full;
		@apply overflow-y-auto;
		@apply font-sans;

		/* Spacing */
		@apply p-4 md:p-8;

		/* Visual */
		background-color: var(--theme-surface-base);
	}

	.settings-inner {
		/* Layout */
		@apply max-w-2xl mx-auto;
		@apply flex flex-col;

		/* Spacing */
		@apply gap-6;
	}

	.header {
		/* Layout */
		@apply flex items-center justify-between;
		@apply sticky top-0;
		@apply z-10;

		/* Spacing */
		@apply py-4;

		/* Visual */
		@apply bg-slate-50/90 backdrop-blur-sm;
	}

	.title {
		/* Visual */
		@apply text-3xl font-bold text-slate-800;
	}

	/* Button של הקיט (secondary = ירוק ב-theme) — גודל וצל כמו הכפתור הקודם */
	:global(.lotto-back-button) {
		min-height: auto;
		padding: 0.625rem 1.25rem;
		border-radius: 0.75rem;
		box-shadow: var(--theme-shadow-elevated);
	}
</style>

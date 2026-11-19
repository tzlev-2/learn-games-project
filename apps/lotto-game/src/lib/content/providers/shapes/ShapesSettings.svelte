<script lang="ts">
	/**
	 * הגדרות ספק הצורות שאינן בחירת פריטים — מצב צבעים.
	 * בחירת הצורות עצמה מוצגת ע"י AxisSelector של הקיט.
	 */
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import type { ProviderSettingsProps } from '$lib/content/types';
	import { language } from '$lib/language';
	import type { ShapesProviderSettings } from './index';

	let { settings, onSettingsUpdate }: ProviderSettingsProps<ShapesProviderSettings> = $props();

	const colorMode = $derived(settings?.colorMode ?? 'random');
	const t = language.content.shapes;
</script>

<div class="shapes-settings" dir="rtl">
	<h3 class="title">{t.colorModeTitle}</h3>
	<SegmentedControl
		options={[
			{ id: 'random', label: t.colorModeRandom, icon: '🌈' },
			{ id: 'uniform', label: t.colorModeUniform, icon: '🔵' }
		]}
		value={colorMode}
		onchange={(id) => onSettingsUpdate({ colorMode: id as ShapesProviderSettings['colorMode'] })}
	/>
</div>

<style type="text/postcss">
	@reference "tailwindcss";

	.shapes-settings {
		/* Layout */
		@apply w-full;
	}

	.title {
		/* Spacing */
		@apply m-0 mb-4;

		/* Visual */
		@apply font-bold text-slate-700;
	}
</style>

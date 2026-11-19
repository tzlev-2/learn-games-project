<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * `none` — שקוף; לשימוש כשהאפליקציה מציירת רקע משלה (למשל gradient) מאחורי ה-shell.
	 */
	type Background = 'base' | 'sunken' | 'none';

	/**
	 * `page` — ה-shell הוא הדף: לפחות גובה ה-viewport (`min-height: 100dvh`).
	 * `fill` — ה-shell ממלא בדיוק את ההורה (`height: 100%`) ו-`<main>` מקבל גובה מוגדר,
	 *          כך שתוכן עם `height: 100%` (למשל לוח שמחשב את גודלו) לא חורג מהמסך.
	 */
	type Layout = 'page' | 'fill';

	interface Props {
		header?: Snippet;
		footer?: Snippet;
		background?: Background;
		layout?: Layout;
		children: Snippet;
	}

	let { header, footer, background = 'base', layout = 'page', children }: Props = $props();

	const bgClass = $derived(
		background === 'sunken' ? 'bg-surface-sunken' : background === 'none' ? '' : 'bg-surface-base'
	);
	const layoutClass = $derived(layout === 'fill' ? 'h-full min-h-0 overflow-hidden' : '');
	const layoutStyle = $derived(layout === 'fill' ? undefined : 'min-height: 100dvh');
</script>

<div
	data-layout={layout}
	class="flex flex-col {bgClass} {layoutClass} font-body text-text-primary"
	style={layoutStyle}
>
	{#if header}
		<div class="shrink-0">
			{@render header()}
		</div>
	{/if}

	<main class="flex-1 overflow-hidden {layout === 'fill' ? 'min-h-0' : ''}">
		{@render children()}
	</main>

	{#if footer}
		<div class="shrink-0">
			{@render footer()}
		</div>
	{/if}
</div>

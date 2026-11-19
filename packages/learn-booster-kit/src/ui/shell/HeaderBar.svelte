<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'compact';

	interface Props {
		leftActions?: Snippet;
		centerInfo?: Snippet;
		rightActions?: Snippet;
		variant?: Variant;
		/**
		 * `true` — אזורי הצד מקבלים רוחב שווה (`flex: 1`) והאזור המרכזי נשאר ברוחב התוכן,
		 * כך שהמרכז ממורכז ביחס ל-header כולו גם כשהצדדים ברוחב שונה.
		 * `false` (ברירת מחדל) — המרכז ממלא את המקום שנותר בין הצדדים.
		 */
		balanced?: boolean;
		class?: string;
	}

	let {
		leftActions,
		centerInfo,
		rightActions,
		variant = 'default',
		balanced = false,
		class: className = ''
	}: Props = $props();

	const paddingClass = $derived(variant === 'compact' ? 'px-3 py-2' : 'px-5 py-3');
	const sideClass = $derived(balanced ? 'flex-1 basis-0 min-w-0' : '');
	const centerClass = $derived(balanced ? 'shrink-0' : 'flex-1');
</script>

<header
	data-variant={variant}
	data-balanced={balanced}
	class="lbk-header-bar flex items-center justify-between bg-surface-header text-text-on-header border-b border-border-subtle shadow-card {balanced
		? 'gap-4'
		: ''} {paddingClass} {className}"
>
	<div class="flex items-center gap-3 {sideClass}">
		{#if leftActions}
			{@render leftActions()}
		{/if}
	</div>
	<div class="flex items-center gap-3 justify-center {centerClass}">
		{#if centerInfo}
			{@render centerInfo()}
		{/if}
	</div>
	<div class="flex items-center gap-3 justify-end {sideClass}">
		{#if rightActions}
			{@render rightActions()}
		{/if}
	</div>
</header>

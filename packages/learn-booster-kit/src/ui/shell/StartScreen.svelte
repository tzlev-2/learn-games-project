<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../primitives/Button.svelte';

	interface PrimaryAction {
		label: string;
		onclick: () => void;
		/** צבע הכפתור לפי ה-theme. ברירת מחדל: `primary`. */
		color?: 'primary' | 'secondary';
		/** אייקון שמוצג ליד ה-label (למשל ▶). */
		icon?: Snippet;
		/** classes נוספים לכפתור (append-only). */
		class?: string;
	}

	/** `none` — שקוף; לשימוש כשהאפליקציה מציירת רקע משלה מאחורי המסך. */
	type Background = 'base' | 'none';

	interface Props {
		title: string;
		subtitle?: string;
		primaryAction: PrimaryAction;
		secondaryActions?: Snippet;
		heroIllustration?: Snippet;
		background?: Background;
	}

	let {
		title,
		subtitle,
		primaryAction,
		secondaryActions,
		heroIllustration,
		background = 'base'
	}: Props = $props();
</script>

<div
	data-background={background}
	class="flex flex-col items-center justify-center min-h-screen gap-8 px-6 text-center {background ===
	'none'
		? ''
		: 'bg-surface-base'}"
>
	{#if heroIllustration}
		<div class="mb-2">
			{@render heroIllustration()}
		</div>
	{/if}

	<div class="flex flex-col items-center gap-4">
		<!-- tokens אופציונליים לכותרת: theme יכול להגדיר גודל/צבע/משקל תצוגה; אחרת נופל לברירות המחדל -->
		<h1
			class="font-display m-0"
			style="font-size: var(--theme-font-size-display, var(--theme-font-size-xl)); color: var(--theme-text-heading, var(--theme-text-primary)); font-weight: var(--theme-font-weight-display, 700)"
		>
			{title}
		</h1>
		{#if subtitle}
			<p class="text-text-secondary m-0" style="font-size: var(--theme-font-size-lg)">
				{subtitle}
			</p>
		{/if}
	</div>

	<div class="flex flex-col items-center gap-4 w-full max-w-xs">
		<Button
			variant="primary"
			size="lg"
			color={primaryAction.color ?? 'primary'}
			onclick={primaryAction.onclick}
			class="w-full gap-3 {primaryAction.class ?? ''}"
		>
			{primaryAction.label}
			{#if primaryAction.icon}
				{@render primaryAction.icon()}
			{/if}
		</Button>
		{#if secondaryActions}
			{@render secondaryActions()}
		{/if}
	</div>
</div>

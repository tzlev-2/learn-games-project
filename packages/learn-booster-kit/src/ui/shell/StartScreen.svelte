<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../primitives/Button.svelte';

	interface PrimaryAction {
		label: string;
		onclick: () => void;
		/** צבע הכפתור לפי ה-theme. ברירת מחדל: `primary`. */
		color?: 'primary' | 'secondary';
		/** אייקון מוביל — לפני ה-label ב-DOM (ב-RTL: מימין לטקסט), למשל ▶. */
		icon?: Snippet;
		/** classes נוספים לכפתור (append-only). */
		class?: string;
	}

	/** `none` — שקוף; לשימוש כשהאפליקציה מציירת רקע משלה מאחורי המסך. */
	type Background = 'base' | 'none';

	/**
	 * `screen` (ברירת מחדל) — לפחות גובה ה-viewport (`min-h-screen`), למסך פתיחה בלי header.
	 * `fill` — ממלא את ההורה (`h-full`) וגולל בתוכו; למסך פתיחה שיושב מתחת ל-header.
	 */
	type Layout = 'screen' | 'fill';

	interface Props {
		title: string;
		subtitle?: string;
		primaryAction: PrimaryAction;
		secondaryActions?: Snippet;
		heroIllustration?: Snippet;
		background?: Background;
		layout?: Layout;
		/** תוכן בין הכותרת לכפתור (למשל בורר נושא). מרונדר ברוחב מלא, לא בעמודת הכפתור. */
		children?: Snippet;
		/** classes נוספים לעטיפה החיצונית (append-only), למשל ריווח. */
		class?: string;
	}

	let {
		title,
		subtitle,
		primaryAction,
		secondaryActions,
		heroIllustration,
		background = 'base',
		layout = 'screen',
		children,
		class: className = ''
	}: Props = $props();
</script>

<div
	data-background={background}
	data-layout={layout}
	class="flex flex-col items-center {layout === 'fill'
		? 'h-full min-h-0 overflow-y-auto justify-center-safe'
		: 'min-h-screen justify-center'} gap-8 px-6 text-center {background === 'none'
		? ''
		: 'bg-surface-base'} {className}"
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

	{#if children}
		{@render children()}
	{/if}

	<div class="flex flex-col items-center gap-4 w-full max-w-xs">
		<Button
			variant="primary"
			size="lg"
			color={primaryAction.color ?? 'primary'}
			onclick={primaryAction.onclick}
			class="w-full gap-3 {primaryAction.class ?? ''}"
		>
			{#if primaryAction.icon}
				{@render primaryAction.icon()}
			{/if}
			{primaryAction.label}
		</Button>
		{#if secondaryActions}
			{@render secondaryActions()}
		{/if}
	</div>
</div>

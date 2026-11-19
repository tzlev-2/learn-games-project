<!--
  טבעת ספירה לאחור inline (בתוך זרימת הדף, לא overlay).
  חולצה מ-sort-cards-game / train-addition-game: הטבעת יושבת מתחת לכרטיס / לכפתורי התשובה,
  והתוכן שמסביב נשאר גלוי. ל-overlay שחוסם את המסך — CooldownOverlay.
-->
<script lang="ts">
	import { cooldownProgress } from './cooldown-math.js';

	// היקף המעגל ב-viewBox 80×80: 2π × 35 ≈ 219.9
	const R = 35;
	const CIRC = 2 * Math.PI * R;

	interface Props {
		untilTs: number;
		durationMs: number;
		/** טקסט מתחת לטבעת (למשל "המתן..."). */
		message?: string;
		/**
		 * `true` (ברירת מחדל) — כשאין ספירה, הטבעת שקופה אבל ממשיכה לתפוס מקום,
		 * כך שהפריסה לא "קופצת" בתחילת/סוף ההמתנה. `false` — לא מרונדר כלום.
		 */
		reserveSpace?: boolean;
		onComplete?: () => void;
		/** classes לעטיפה החיצונית (append-only). */
		class?: string;
		/**
		 * classes לגודל הטבעת (למשל `h-10 w-10`). בלי — 56px, ומ-640px ומעלה 80px.
		 * ברירות המחדל יושבות ב-CSS של הקומפוננטה תחת `@layer components`,
		 * כך ש-utilities של הצרכן גוברות עליהן.
		 */
		ringClass?: string;
		/** classes לגודל המספר. בלי — 1.25rem, ומ-640px ומעלה 1.875rem. */
		numberClass?: string;
		/** classes להודעה. בלי — 1.125rem, משקל 500. */
		messageClass?: string;
	}

	let {
		untilTs,
		durationMs,
		message,
		reserveSpace = true,
		onComplete,
		class: className = '',
		ringClass = '',
		numberClass = '',
		messageClass = ''
	}: Props = $props();

	let now = $state(Date.now());

	$effect(() => {
		// מאזין ל-untilTs: הפעלה מחדש כשמתחילה המתנה חדשה
		const target = untilTs;
		let fired = Date.now() >= target;
		const interval = setInterval(() => {
			now = Date.now();
			if (!fired && now >= target) {
				fired = true;
				onComplete?.();
			}
		}, 100);
		return () => clearInterval(interval);
	});

	const isActive = $derived(now < untilTs);
	const remainingSec = $derived(isActive ? Math.ceil((untilTs - now) / 1000) : 0);
	/** החלק שנותר (1 → 0) — הקשת מתקצרת עם הזמן */
	const remainingFraction = $derived(isActive ? 1 - cooldownProgress(now, untilTs, durationMs) : 0);
</script>

{#if isActive || reserveSpace}
	<div
		data-active={isActive}
		class="flex flex-col items-center gap-2 transition-opacity duration-300 {isActive
			? 'opacity-100'
			: 'invisible opacity-0'} {className}"
		aria-hidden={!isActive}
	>
		<div class="lbk-ring relative flex items-center justify-center {ringClass}">
			<svg class="lbk-ring absolute -rotate-90 {ringClass}" viewBox="0 0 80 80" aria-hidden="true">
				<circle
					cx="40"
					cy="40"
					r={R}
					fill="none"
					stroke="var(--theme-border-subtle)"
					stroke-width="6"
				/>
				<circle
					cx="40"
					cy="40"
					r={R}
					fill="none"
					stroke="var(--theme-feedback-error)"
					stroke-width="6"
					stroke-linecap="round"
					stroke-dasharray="{remainingFraction * CIRC} {CIRC}"
				/>
			</svg>
			<span
				class="lbk-ring-number font-bold tabular-nums {numberClass}"
				style="color: var(--theme-feedback-error)"
			>
				{remainingSec}
			</span>
		</div>
		{#if message}
			<span class="lbk-ring-message text-text-secondary {messageClass}">{message}</span>
		{/if}
	</div>
{/if}

<style>
	/* ברירות מחדל ב-@layer components: utilities של הצרכן (ringClass וכו') גוברות עליהן,
	   ו-CSS בלי layer שנטען אחר כך לא "דורס" breakpoints כמו ש-utility כפולה הייתה עושה. */
	@layer components {
		.lbk-ring {
			width: 3.5rem;
			height: 3.5rem;
		}
		.lbk-ring-number {
			font-size: 1.25rem;
			line-height: 1.75rem;
		}
		.lbk-ring-message {
			font-size: 1.125rem;
			line-height: 1.75rem;
			font-weight: 500;
		}
		@media (min-width: 40rem) {
			.lbk-ring {
				width: 5rem;
				height: 5rem;
			}
			.lbk-ring-number {
				font-size: 1.875rem;
				line-height: 2.25rem;
			}
		}
	}
</style>

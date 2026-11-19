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
		/** גודל הטבעת. ברירת מחדל: `h-14 w-14 sm:h-20 sm:w-20`. */
		ringClass?: string;
		/** גודל המספר. ברירת מחדל: `text-xl sm:text-3xl`. */
		numberClass?: string;
		/** עיצוב ההודעה. ברירת מחדל: `text-lg font-medium`. */
		messageClass?: string;
	}

	let {
		untilTs,
		durationMs,
		message,
		reserveSpace = true,
		onComplete,
		class: className = '',
		ringClass = 'h-14 w-14 sm:h-20 sm:w-20',
		numberClass = 'text-xl sm:text-3xl',
		messageClass = 'text-lg font-medium'
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
		<div class="relative flex items-center justify-center {ringClass}">
			<svg class="absolute -rotate-90 {ringClass}" viewBox="0 0 80 80" aria-hidden="true">
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
				class="font-bold tabular-nums {numberClass}"
				style="color: var(--theme-feedback-error)"
			>
				{remainingSec}
			</span>
		</div>
		{#if message}
			<span class="text-text-secondary {messageClass}">{message}</span>
		{/if}
	</div>
{/if}

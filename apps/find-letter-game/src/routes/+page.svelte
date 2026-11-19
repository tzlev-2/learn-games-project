<script lang="ts">
	import { goto } from '$app/navigation';
	import { AdminGate, StartScreen, IconButton, SettingsIcon, PlayIcon } from 'learn-booster-kit';
	import { language } from '$lib/services/language';
	import { gameState } from '$lib/stores/game-state.svelte';

	/**
	 * לחיצת ה-CTA — מתחילה את המשחק.
	 *
	 * **הסיבה ש-`resetGame()` רץ כאן ולא ב-onMount של `/play`:**
	 * הדפדפן דורש user gesture בשביל לאפשר `Audio.play()` (autoplay policy).
	 * `gameState.resetGame()` קורא ל-`startBoard()` שמתזמן `setTimeout(250)` ובו
	 * `repeatTarget()` שעושה `Audio.play()`. אם הקריאה לא רצה תחת call-stack של
	 * gesture חי, ה-`play()` עלול להיחסם (במיוחד ב-iOS Safari).
	 * כאן ה-resetGame רץ בתוך ה-click handler — gesture חי, האודיו עובר.
	 */
	function handleStart() {
		gameState.resetGame();
		goto('/play');
	}
</script>

<svelte:head>
	<title>{language.pageTitle}</title>
</svelte:head>

<div class="start-wrap">
	<!-- אייקון הגדרות (AdminGate) — מורה יכול לעבור להגדרות בלי להיכנס למשחק -->
	<div class="settings-corner">
		<AdminGate onUnlock={() => goto('/settings')}>
			<IconButton label={language.settingsLabel}>
				{#snippet icon()}<SettingsIcon size={22} />{/snippet}
			</IconButton>
		</AdminGate>
	</div>

	<!-- background="none" — ה-gradient של ה-layout נשאר גלוי מאחורי המסך -->
	<StartScreen
		title={language.gameTitle}
		subtitle={language.startScreenSubtitle}
		background="none"
		primaryAction={{
			label: language.startButtonLabel,
			onclick: handleStart,
			color: 'secondary',
			icon: playIcon,
			class: 'fl-start-cta'
		}}
	>
		{#snippet heroIllustration()}
			<div class="hero-letter" aria-hidden="true">{language.startScreenHeroLetter}</div>
		{/snippet}
		{#snippet secondaryActions()}
			<p class="tip">{language.startScreenTip}</p>
		{/snippet}
	</StartScreen>
</div>

{#snippet playIcon()}
	<PlayIcon size={28} class="shrink-0" />
{/snippet}

<style>
	.start-wrap {
		flex: 1;
		position: relative;
		min-height: 0;
	}

	.settings-corner {
		position: absolute;
		top: 1rem;
		/* RTL — הגלגל בפינה השמאלית, כמו ב-header של מסך המשחק */
		inset-inline-end: 1rem;
		z-index: 20;
	}

	.hero-letter {
		font-size: clamp(7rem, 22vmin, 12rem);
		font-weight: 900;
		color: var(--theme-text-heading, var(--theme-brand-primary));
		line-height: 1;
		/* אנימציית נשימה עדינה — מושכת תשומת לב בלי להיות מטרידה */
		animation: breathe 3.2s ease-in-out infinite;
		text-shadow: 0 8px 30px rgba(30, 58, 138, 0.15);
		user-select: none;
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.06);
		}
	}

	.tip {
		font-size: 0.95rem;
		color: var(--theme-text-secondary);
		margin: 0;
	}

	/*
	 * עיטור ה-CTA של מסך הפתיחה (מעל ה-Button של הקיט): gradient בצבעי ה-secondary
	 * של ה-theme, הילה ו-pulse עדין שמושך את העין. CSS של קומפוננטה אינו ב-@layer,
	 * ולכן גובר על utilities של Tailwind בלי !important.
	 */
	:global(.fl-start-cta) {
		background-image: linear-gradient(
			135deg,
			var(--theme-brand-secondary),
			var(--theme-brand-secondary-hover)
		);
		font-weight: 800;
		box-shadow: 0 12px 30px rgba(249, 115, 22, 0.4);
		transition:
			transform 150ms ease,
			box-shadow 150ms ease;
		animation: fl-pulse 2.4s ease-in-out infinite;
	}

	:global(.fl-start-cta:hover) {
		transform: translateY(-2px);
		box-shadow: 0 16px 36px rgba(249, 115, 22, 0.5);
		animation-play-state: paused;
	}

	:global(.fl-start-cta:active) {
		transform: translateY(0);
	}

	@keyframes -global-fl-pulse {
		0%,
		100% {
			box-shadow: 0 12px 30px rgba(249, 115, 22, 0.4);
		}
		50% {
			box-shadow:
				0 12px 30px rgba(249, 115, 22, 0.4),
				0 0 0 12px rgba(249, 115, 22, 0.12);
		}
	}
</style>

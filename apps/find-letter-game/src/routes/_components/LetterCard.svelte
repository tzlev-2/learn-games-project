<script lang="ts">
	import type { LetterCard as LetterCardType } from '$lib/utils/letters';

	interface Props {
		card: LetterCardType;
		isShaking: boolean;
		isSuccess: boolean;
		disabled: boolean;
		onclick: (card: LetterCardType) => void;
	}

	let { card, isShaking, isSuccess, disabled, onclick }: Props = $props();
</script>

<button
	type="button"
	class="letter-card"
	class:lbk-anim-shake={isShaking}
	class:lbk-anim-pop={isSuccess}
	class:success={isSuccess}
	class:disabled
	{disabled}
	onclick={() => onclick(card)}
	aria-label={card.speak}
>
	<span class="letter">{card.display}</span>
</button>

<style>
	.letter-card {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--theme-surface-elevated);
		border: 2px solid var(--theme-border-subtle);
		border-radius: 1.25rem;
		box-shadow:
			0 1px 0 rgba(15, 23, 42, 0.04),
			0 8px 20px rgba(15, 23, 42, 0.06);
		cursor: pointer;
		transition:
			transform 120ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
		/* הגריד מכתיב את המידות (rows/cols) — אין צורך ב-aspect-ratio */
		width: 100%;
		height: 100%;
		min-height: 0;
		min-width: 0;
		padding: 0;
		/* container query — מאפשר לתוכן הפנימי להגיב לגודל הכרטיס */
		container-type: size;
		container-name: card;
	}

	.letter-card:hover:not(.disabled) {
		transform: translateY(-2px);
		border-color: #fdba74;
		box-shadow: 0 12px 30px rgba(249, 115, 22, 0.18);
	}

	.letter-card:active:not(.disabled) {
		transform: translateY(0);
	}

	.letter-card.disabled {
		cursor: default;
	}

	/* הבזק הצלחה — האנימציה מגיעה מהקיט (lbk-anim-pop), הצבעים מה-theme */
	.letter-card.success {
		background: var(--theme-feedback-success-bg);
		border-color: var(--theme-feedback-success);
	}

	.letter {
		font-family: 'David', 'Frank Ruehl CLM', 'Times New Roman', serif;
		font-weight: 800;
		color: var(--theme-brand-primary);
		/* גודל הפונט מתאים את עצמו לגודל הכרטיס — 60% מהגובה הזמין */
		font-size: 60cqh;
		line-height: 1;
	}
</style>

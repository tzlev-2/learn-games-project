<script lang="ts">
	/**
	 * renderComponent של ה-Provider "אותיות וניקוד" — מציג את ה-display של
	 * הצירוף (למשל "בַּ", "גִ") בגודל שממלא את הכרטיס (container query).
	 * משחק שמציג את הפריט אחרת (find-letter — LetterCard משלו) לא חייב להשתמש בו.
	 */
	import type { CardContentProps } from '../../types';
	import type { LetterVowelPair } from './pair';

	let { content }: CardContentProps = $props();

	const display = $derived((content.data as LetterVowelPair | undefined)?.display ?? '');
</script>

<div class="lbk-letter-pair">
	<span class="lbk-letter-pair__glyph" dir="rtl">{display}</span>
</div>

<style>
	.lbk-letter-pair {
		container-type: inline-size;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.lbk-letter-pair__glyph {
		font-size: 55cqw;
		line-height: 1;
	}
</style>

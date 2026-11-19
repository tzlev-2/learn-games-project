<script lang="ts">
	/**
	 * תצוגת פריט קריאה במסך הבחירה (itemComponent של ציר הקריאה ב-AxisSelector)
	 */
	import type { AxisItemProps } from '$lib/content/types';
	import type { ReadingItem } from './index';

	let { item }: AxisItemProps<ReadingItem> = $props();
</script>

<span class="reading-axis-item">
	<span class="item-letter">{item.value.letter}</span>
	<img src={item.value.imagePath} alt={item.value.helper} class="item-image" />
	<span class="item-helper">{item.value.helper}</span>
</span>

<style type="text/postcss">
	@reference "tailwindcss";

	.reading-axis-item {
		@apply flex flex-col items-center justify-center gap-1;
	}

	.item-letter {
		@apply text-xl font-bold;
	}

	.item-image {
		@apply h-10 w-10 rounded object-contain;
	}

	.item-helper {
		@apply text-xs font-medium;
	}
</style>

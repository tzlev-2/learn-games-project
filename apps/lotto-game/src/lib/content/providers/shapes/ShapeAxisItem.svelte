<script lang="ts">
	/**
	 * תצוגת צורה במסך הבחירה (itemComponent של ציר הצורות ב-AxisSelector)
	 */
	import type { AxisItemProps } from '$lib/content/types';
	import type { ShapeDefinition } from './index';
	import ShapeSvg from './ShapeSvg.svelte';

	let { item }: AxisItemProps<ShapeDefinition> = $props();
</script>

<span class="shape-axis-item">
	<span class="shape-icon">
		<!-- currentColor — הצבע נגזר ממצב הבחירה של האריח ב-AxisSelector -->
		<ShapeSvg shapeId={item.value.id} color="currentColor" size="100%" />
	</span>
	<span class="shape-label">{item.label}</span>
</span>

<style type="text/postcss">
	@reference "tailwindcss";

	.shape-axis-item {
		@apply flex flex-col items-center gap-1;
	}

	.shape-icon {
		@apply flex h-10 w-10 items-center justify-center;
	}

	.shape-label {
		@apply text-xs font-medium;
	}
</style>

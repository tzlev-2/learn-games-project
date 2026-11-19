<script lang="ts">
	interface Props {
		size?: number | string;
		class?: string;
	}
	let { size = 24, class: className = '' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="currentColor"
	stroke="none"
	class={className}
	aria-hidden="true"
>
	<!-- Play triangle (Lucide play style, מלא). מצביע ימינה גם ב-RTL — כמו כפתור ניגון סטנדרטי -->
	<polygon points="5 3 19 12 5 21 5 3" />
</svg>

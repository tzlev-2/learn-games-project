<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { playSuccess } from '$lib/utils/sound';
	import { Button } from 'learn-booster-kit';
	import { language } from '$lib/services/language';

	let { onReplay, onExit, onReward, rewardEnabled } = $props<{
		onReplay: () => void;
		onExit: () => void;
		onReward?: () => void;
		rewardEnabled?: boolean;
	}>();

	let isRewardPending = $state(false);

	function handleRewardClick() {
		if (isRewardPending || !onReward) return; // מניעת לחיצות כפולות
		isRewardPending = true;
		onReward();
	}

	onMount(() => {
		playSuccess();
	});
</script>

<div
	class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 text-center"
	in:fade
>
	<div
		class="flex flex-col items-center gap-8 max-w-lg w-full"
		in:scale={{ duration: 500, start: 0.8 }}
	>
		<!-- Animated Trophy/Star -->
		<div class="text-9xl animate-bounce-slow filter drop-shadow-xl">🏆</div>

		<h2 class="text-5xl md:text-7xl font-black text-orange-500 drop-shadow-sm">כל הכבוד!</h2>

		<p class="text-2xl text-slate-600 font-medium">סיימת את כל הקלפים בקופסה זו.</p>

		<div class="flex flex-col sm:flex-row gap-4 w-full mt-8">
			<Button onclick={onReplay} class="wd-btn-green wd-completion-btn flex-1">
				{language.completionReplay}
			</Button>

			<Button variant="secondary" onclick={onExit} class="wd-btn-slate wd-completion-btn flex-1">
				{language.completionExit}
			</Button>
		</div>
		{#if rewardEnabled && onReward}
			<div class="w-full mt-2">
				<Button
					onclick={handleRewardClick}
					disabled={isRewardPending}
					class="wd-btn-purple wd-completion-btn w-full {isRewardPending ? '' : 'animate-pulse'}"
				>
					{language.completionReward}
				</Button>
			</div>
		{/if}
	</div>
</div>

<style type="text/postcss">
	.animate-bounce-slow {
		animation: bounce 3s infinite;
	}
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(-10%);
			animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
		}
		50% {
			transform: translateY(0);
			animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
		}
	}
</style>

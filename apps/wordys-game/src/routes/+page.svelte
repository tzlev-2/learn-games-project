<script lang="ts">
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { StartScreen } from 'learn-booster-kit';
	import { language } from '$lib/services/language';

	function startApp() {
		goto('/select');
	}
</script>

<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-br from-orange-400 to-yellow-300 p-6 text-center"
>
	<div
		class="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12"
		in:fly={{ y: 50, duration: 800, delay: 200 }}
	>
		<!-- הכותרת (כתום, 900, ~96px) מגיעה מה-tokens של theme wordys -->
		<StartScreen
			title={language.gameTitle}
			subtitle={language.startSubtitle}
			background="none"
			layout="fill"
			class="wd-splash"
			primaryAction={{
				label: language.startButton,
				onclick: startApp,
				class: 'wd-btn-green wd-splash-btn'
			}}
		>
			<p class="m-0 text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
				{language.startDescription}
			</p>
		</StartScreen>
	</div>
</div>

<style>
	/* הריווח של הכרטיס המקורי: mb-4 / mb-8 / mb-10 במקום gap-8 + px-6 של StartScreen */
	:global(.wd-splash) {
		padding-inline: 0;
		gap: 2.5rem;
		/* תת-הכותרת: slate-700, text-2xl → md:text-3xl, bold */
		--color-text-secondary: #334155;
		--theme-font-size-lg: 1.5rem;
	}
	@media (min-width: 48rem) {
		:global(.wd-splash) {
			--theme-font-size-lg: 1.875rem;
		}
	}
	:global(.wd-splash > div:first-child) {
		gap: 1rem;
	}
	:global(.wd-splash h1) {
		letter-spacing: -0.025em;
		line-height: 1;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05));
		animation: wd-bounce-slow 3s infinite;
	}
	:global(.wd-splash h1 + p) {
		font-weight: 700;
	}
	@keyframes -global-wd-bounce-slow {
		0%,
		100% {
			transform: translateY(-5%);
			animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
		}
		50% {
			transform: translateY(0);
			animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
		}
	}

	/* ה-CTA: ירוק, רוחב לפי התוכן, rounded-2xl, text-2xl font-black, פעימה איטית */
	:global(.wd-splash-btn) {
		width: auto;
		padding-inline: 2.5rem;
		border-radius: 1rem;
		font-size: 1.5rem;
		font-weight: 900;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
		animation: wd-pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		transition: all 0.3s;
	}
	:global(.wd-splash-btn:hover) {
		transform: translateY(-0.25rem);
	}
	@keyframes -global-wd-pulse-slow {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.9;
		}
	}
</style>

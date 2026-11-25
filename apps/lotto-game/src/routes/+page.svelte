<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { 
		generateCards, 
		contentMatches,
		type Card as CardType
	} from '$lib/utils/gameLogic';
	import { playSuccess, playError, playWin } from '$lib/utils/sound';
	import {
		boosterService,
		AdminGate,
		GameShell,
		HeaderBar,
		ScoreBadge,
		IconButton,
		Button,
		SettingsIcon
	} from 'learn-booster-kit';
	import { language } from '$lib/language';
	import { settings } from '$lib/stores/settings.svelte';
	import Confetti from './_components/Confetti.svelte';
	import Board from './_components/Board.svelte';
	import winnerLogo from '$lib/assets/winner_logo.png';

	// מצב המשחק
	let cards = $state<CardType[]>([]);
	let selectedCards = $state<number[]>([]); // אינדקסים של כרטיסים נבחרים
	let matches = $state(0);
	let isLocked = $state(false);
	let won = $state(false);
	let currentRound = $state(1);
	let nextRoundTimer = $state<number | null>(null);

	let showRewardButton = $state(false);
	let isRewardPending = $state(false);

	// כותרת דינמית לפי סוג התוכן ומצב המשחק
	const provider = $derived(settings.currentProvider);
	const gameTitle = $derived(language.game.title(settings.gameMode, provider.displayName));

	// מונה ניסיונות (רלוונטי למצב זיכרון)
	let attempts = $state(0);

	onMount(async () => {

		startNewGame();
	});

	// Timer Effect
	$effect(() => {
		let interval: ReturnType<typeof setInterval>;
		if (nextRoundTimer !== null && nextRoundTimer > 0) {
			interval = setInterval(() => {
				nextRoundTimer = (nextRoundTimer as number) - 1;
				if (nextRoundTimer <= 0) {
					clearInterval(interval);
					// התחלת סבב הבא
					startNewGame(currentRound + 1);
					nextRoundTimer = null;
				}
			}, 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	});

	function startNewGame(round = 1) {
		// שליפת ה-provider והגדרות
		const currentProvider = settings.currentProvider;
		const providerSettings = settings.getCurrentProviderSettings();

		// בחירת המורה (ProviderSelection) — ה-provider מייצר ממנה את ה-deck
		const selection = settings.getCurrentSelection();

		const newCards = generateCards({
			pairCount: settings.pairCount,
			provider: currentProvider,
			selection,
			settings: providerSettings
		});
		
		cards = newCards;
		selectedCards = [];
		matches = 0;
		attempts = 0;
		isLocked = false;
		won = false;
		showRewardButton = false;
		isRewardPending = false;
		currentRound = round;
		nextRoundTimer = null;
	}

	function handleCardClick(id: number) {
		if (isLocked) return;

		const clickedCardIndex = cards.findIndex(c => c.id === id);
		if (clickedCardIndex === -1) return;

		const clickedCard = cards[clickedCardIndex];

		// התעלם אם כבר מותאם או נבחר
		if (clickedCard.isMatched || clickedCard.isSelected) {
			if (clickedCard.isSelected && settings.enableDeselect && settings.gameMode !== 'memory') {
				// ביטול בחירה (רק אם מותר, לא במצב זיכרון)
				cards[clickedCardIndex].isSelected = false;
				selectedCards = selectedCards.filter(index => index !== clickedCardIndex);
			}
			return;
		}

		// בחירת הכרטיס
		cards[clickedCardIndex].isSelected = true;
		selectedCards = [...selectedCards, clickedCardIndex];

		// בדיקת התאמה
		if (selectedCards.length === 2) {
			isLocked = true;
			attempts += 1;

			const firstIndex = selectedCards[0];
			const secondIndex = selectedCards[1];
			const firstCard = cards[firstIndex];
			const secondCard = cards[secondIndex];

			// השתמש בפונקציית ההשוואה מה-provider
			const currentProvider = settings.currentProvider;
			const feedbackMs = settings.feedbackDurationSec * 1000;
			const unlockDelayMs = feedbackMs + 500; // חצי שנייה נוספת אחרי המשוב

			if (contentMatches(firstCard, secondCard, currentProvider)) {
				// התאמה! — הצג זוהר הצלחה
				playSuccess();
				cards[firstIndex].isSuccess = true;
				cards[secondIndex].isSuccess = true;

				setTimeout(() => {
					cards[firstIndex].isMatched = true;
					cards[secondIndex].isMatched = true;
					cards[firstIndex].isSelected = false;
					cards[secondIndex].isSelected = false;
					cards[firstIndex].isSuccess = false;
					cards[secondIndex].isSuccess = false;

					matches += 1;
					selectedCards = [];

					if (matches === settings.pairCount) {
						isLocked = false;
						handleWin();
					}
				}, feedbackMs);

				// שחרור נעילה אחרי המשוב + חצי שנייה (אם לא ניצחון)
				setTimeout(() => {
					if (!won) isLocked = false;
				}, unlockDelayMs);
			} else {
				// אין התאמה — הצג לתלמיד כדי לזכור
				playError();
				cards[firstIndex].isError = true;
				cards[secondIndex].isError = true;

				setTimeout(() => {
					cards[firstIndex].isSelected = false;
					cards[secondIndex].isSelected = false;
					cards[firstIndex].isError = false;
					cards[secondIndex].isError = false;
					selectedCards = [];
				}, feedbackMs);

				// שחרור נעילה אחרי המשוב + חצי שנייה
				setTimeout(() => {
					isLocked = false;
				}, unlockDelayMs);
			}
		}
	}

	let winsCount = $state(0);

	function handleWin() {
		won = true;
		playWin();
		
		winsCount++;
		// מקור האמת החדש לתדירות - Settings
		const turnsTarget = settings.totalRounds || 1;

		if (settings.boosterEnabled && winsCount >= turnsTarget) {
			if (settings.autoBooster) {
				// הפעלה אוטומטית
				boosterService.triggerReward();
				winsCount = 0;
			} else {
				// הפעלה ידנית - הצגת כפתור
				showRewardButton = true;
			}
		}

		// לוגיקת לולאה
		// אם יש כפתור פרס, לא מפעילים טיימר אוטומטי
		if (!showRewardButton) {
			const hasNextRound = settings.loopMode === 'infinite' || currentRound < settings.totalRounds;
			if (hasNextRound) {
				if (settings.autoNextRound) {
					// מעבר אוטומטי לסבב הבא ללא פופאפ
					won = false;
					startNewGame(currentRound + 1);
				} else {
					nextRoundTimer = 5;
				}
			}
		}
	}

	function handleManualRewardClick() {
		if (isRewardPending) return; // מניעת לחיצות כפולות
		isRewardPending = true;
		boosterService.triggerReward();
		winsCount = 0;
		showRewardButton = false;
		
		// לאחר קבלת הפרס, האם להמשיך סבב?
		// כרגע נשאיר את המשתמש במסך הניצחון ללא טיימר, הוא יצטרך ללחוץ "משחק חדש" או "סבב הבא"
		// או שנתחיל טיימר? בדרך כלל חוזרים מהבוסטר וצריך ללחוץ ידנית.
		// נוסיף כפתור "המשך" שמופיע אחרי הפרס
	}
</script>

<div class="game-page">
	{#if won}
		<Confetti />
	{/if}

	<GameShell layout="fill" background="none">
		{#snippet header()}
			<HeaderBar class="lotto-header">
				{#snippet leftActions()}
					<!-- לחיצה על הכותרת מתחילה משחק חדש (כמו קודם) -->
					<Button variant="secondary" class="lotto-title-button" onclick={() => startNewGame(1)}>
						<h1 class="title">{gameTitle}</h1>
					</Button>
				{/snippet}

				{#snippet rightActions()}
					<ScoreBadge
						label={language.game.pairsLabel}
						value="{matches}/{settings.pairCount}"
						class="lotto-stat lotto-stat--pairs"
					/>

					{#if settings.loopMode === 'finite' && settings.totalRounds > 1}
						<ScoreBadge
							label={language.game.roundLabel}
							value="{currentRound}/{settings.totalRounds}"
							class="lotto-stat lotto-stat--rounds"
						/>
					{/if}

					{#if settings.loopMode === 'infinite'}
						<ScoreBadge
							label={language.game.roundLabel}
							value={currentRound}
							class="lotto-stat lotto-stat--rounds"
						/>
					{/if}

					{#if settings.gameMode === 'memory'}
						<ScoreBadge
							label={language.game.attemptsLabel}
							value={attempts}
							variant="warning"
							class="lotto-stat lotto-stat--attempts"
						/>
					{/if}

					<AdminGate onUnlock={() => goto('/settings')}>
						<IconButton label={language.game.settingsLabel} variant="floating">
							{#snippet icon()}<SettingsIcon size={22} />{/snippet}
						</IconButton>
					</AdminGate>
				{/snippet}
			</HeaderBar>
		{/snippet}

		<!-- Main Game Area -->
		<div class="game-container">
			<Board {cards} onCardClick={handleCardClick} {isLocked} />
		</div>
	</GameShell>

	{#if won}
		<div class="modal-overlay" transition:fade>
			<div class="modal-content" transition:scale>
				<img src={winnerLogo} alt={language.game.winnerAlt} class="winner-logo" />
				<h2 class="winner-title">{language.game.winnerTitle}</h2>
				<p class="winner-text">{language.game.winnerText}</p>

				{#if showRewardButton}
					<!-- כפתור פרס גדול -->
					<button
						onclick={handleManualRewardClick}
						disabled={isRewardPending}
						class="reward-button"
						class:disabled={isRewardPending}
					>
						<span>🎁</span>
						<span>{language.game.rewardButton}</span>
					</button>
					<div class="skip-wrapper">
						<button onclick={() => startNewGame(currentRound + 1)} class="skip-button">
							{language.game.skipToNextRound}
						</button>
					</div>
				{:else if nextRoundTimer !== null}
					<div class="timer-section">
						<p class="timer-label">{language.game.nextRoundIn}</p>
						<div class="timer-value">{nextRoundTimer}</div>
						<button onclick={() => (nextRoundTimer = 1)} class="timer-skip">
							{language.game.skipNow}
						</button>
					</div>
				{:else}
					<Button
						size="lg"
						color="secondary"
						class="lotto-play-again"
						onclick={() => startNewGame(1)}
					>
						{language.game.playAgain}
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style type="text/postcss">
	@reference "tailwindcss";

	/* Page Container */
	.game-page {
		/* Layout */
		@apply flex flex-col h-screen;
		@apply overflow-hidden;

		/* Visual */
		@apply bg-gradient-to-br from-indigo-100 to-purple-100;
	}

	/* Header — HeaderBar של הקיט; ההתאמות שומרות על המראה של הלוטו.
	   CSS של קומפוננטה אינו ב-@layer, ולכן גובר על ה-utilities של הקיט בלי !important. */
	:global(.lotto-header) {
		position: relative;
		z-index: 10;
		padding: 1rem;
		border-bottom-color: transparent;
	}

	:global(.lotto-title-button) {
		/* זהות הכותרת: רקע ומסגרת עדינים (surface-sunken / border-subtle של ה-theme) */
		min-height: auto;
		padding: 0.5rem 1rem;
		border-radius: var(--theme-radius-lg);
	}

	.title {
		margin: 0;
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 700;
		color: var(--theme-text-heading);
	}

	/* ScoreBadge — מונים: label בצבע משני, ערך גדול בצבע לכל מונה */
	:global(.lotto-stat) {
		padding: 0.5rem 1rem;
		border-radius: var(--theme-radius-lg);
	}

	:global(.lotto-stat > span:first-child) {
		font-size: 1rem;
		color: var(--theme-text-secondary);
	}

	:global(.lotto-stat > span:last-child) {
		font-size: 1.25rem;
		line-height: 1.75rem;
	}

	:global(.lotto-stat--pairs > span:last-child) {
		color: var(--theme-brand-primary);
	}

	:global(.lotto-stat--rounds) {
		background-color: oklch(97.7% 0.014 308.299); /* purple-50 */
		border-color: oklch(94.6% 0.033 307.174); /* purple-100 */
	}

	:global(.lotto-stat--rounds > span:last-child) {
		color: oklch(55.8% 0.288 302.321); /* purple-600 */
	}

	:global(.lotto-stat--attempts) {
		border-color: oklch(96.2% 0.059 95.617); /* amber-100 */
	}


	/* Main Game Area */
	.game-container {
		/* CSS property for container queries */
		container-type: size;

		/* Layout — ממלא את <main> של GameShell */
		@apply flex items-center justify-center;
		@apply h-full overflow-hidden;
	}

	/* Modal */
	.modal-overlay {
		/* Layout */
		@apply fixed inset-0 flex items-center justify-center;
		@apply z-50;

		/* Visual */
		@apply bg-black/50;
	}

	.modal-content {
		/* Layout */
		@apply relative z-50;
		@apply max-w-md w-full;
		@apply flex flex-col items-center;

		/* Spacing */
		@apply p-8 mx-4;

		/* Visual */
		@apply bg-white rounded-2xl shadow-2xl;
		@apply text-center;
	}

	.winner-logo {
		/* Layout */
		@apply w-32 h-32 mx-auto;

		/* Spacing */
		@apply mb-4;

		/* Visual */
		@apply object-contain drop-shadow-lg;
	}

	.winner-title {
		/* Spacing */
		@apply mb-4;

		/* Visual */
		@apply text-5xl font-bold text-green-500;
	}

	.winner-text {
		/* Spacing */
		@apply mb-8;

		/* Visual */
		@apply text-2xl text-gray-600;
	}

	/* Reward Button */
	.reward-button {
		/* Layout */
		@apply w-full flex items-center justify-center;

		/* Spacing */
		@apply gap-3 px-8 py-6;

		/* Visual */
		@apply bg-gradient-to-r from-yellow-400 to-orange-500;
		@apply text-white text-2xl font-black;
		@apply rounded-2xl shadow-xl;

		/* Interactive */
		@apply hover:from-yellow-500 hover:to-orange-600;
		@apply hover:scale-105 active:scale-95;
		@apply transition-transform;
		@apply animate-bounce;
	}

	.reward-button.disabled {
		/* Visual */
		@apply opacity-50;

		/* Interactive */
		@apply cursor-not-allowed scale-100;
		@apply animate-none;
	}

	.skip-wrapper {
		/* Spacing */
		@apply mt-4;
	}

	.skip-button {
		/* Visual */
		@apply text-gray-400 text-sm underline;

		/* Interactive */
		@apply hover:text-gray-600;
	}

	/* Timer Section */
	.timer-section {
		/* Spacing */
		@apply mb-6;
	}

	.timer-label {
		/* Spacing */
		@apply mb-2;

		/* Visual */
		@apply text-lg text-indigo-600 font-bold;
	}

	.timer-value {
		/* Visual */
		@apply text-4xl font-mono font-bold text-indigo-800;
	}

	.timer-skip {
		/* Spacing */
		@apply mt-4;

		/* Visual */
		@apply text-sm text-gray-500 underline;

		/* Interactive */
		@apply hover:text-indigo-600;
	}

	/* Play Again — Button של הקיט (secondary = ירוק ב-theme), ברוחב מלא */
	:global(.lotto-play-again) {
		width: 100%;
		border-radius: 0.75rem;
		font-size: 1.25rem;
		box-shadow: var(--theme-shadow-elevated);
	}
</style>

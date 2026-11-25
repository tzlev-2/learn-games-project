<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		boosterService,
		ProgressWidget,
		type Config,
		AdminGate,
		GameShell,
		HeaderBar,
		Button,
		IconButton,
		ScoreBadge,
		CooldownOverlay,
		SpeakerIcon,
		SettingsIcon
	} from 'learn-booster-kit';
	import Board from '../_components/Board.svelte';
	import { gameState } from '$lib/stores/game-state.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { language } from '$lib/services/language';

	// === Booster config (רק לאתחול — אנחנו לא משתמשים ב-turnsPerReward שלו;
	// המקור לפרגרס הוא ההגדרות המקומיות שלנו: boardsPerSet × questionsPerBoard) ===
	let boosterConfig = $state<Config>();
	let unsubscribeConfig: (() => void) | undefined;

	onMount(async () => {
		// אם נכנסו ישירות ל-/play (כתובת/רענון) — אין user gesture, ה-TTS ייחסם.
		// מחזירים למסך הפתיחה כדי שהמשתמש יתחיל דרך הכפתור.
		// `status === 'IDLE'` אומר ש-resetGame עוד לא רץ — כלומר זו לא כניסה דרך מסך הפתיחה.
		if (gameState.status === 'IDLE') {
			goto('/');
			return;
		}

		if (settings.boosterEnabled) {
			try {
				await boosterService.init();
				unsubscribeConfig = boosterService.config.subscribe((v) => {
					boosterConfig = v;
				});
			} catch (e) {
				console.warn('[booster] init in /play failed:', e);
			}
		}
	});

	onDestroy(() => unsubscribeConfig?.());

	const isLocked = $derived(
		gameState.status === 'SUCCESS' ||
			gameState.status === 'COOLDOWN' ||
			gameState.status === 'IDLE' ||
			gameState.status === 'REWARD'
	);

	// כרטיס המנצח (להבזק הצלחה)
	const successId = $derived(
		gameState.status === 'SUCCESS' && gameState.target ? gameState.target.id : null
	);

	// ה-progress max הוא מספר התשובות הנכונות הנדרש לפרס:
	// boardsPerSet × effectiveQuestionsPerBoard.
	const progressMax = $derived(settings.totalQuestionsPerSet);
</script>

<!-- layout="fill": ה-shell ממלא את מסגרת ה-layout (h-screen) כך שהלוח מחשב את גודלו
     מהשטח שנשאר מתחת ל-header. background="none": ה-gradient של ה-layout נשאר. -->
<GameShell layout="fill" background="none">
	{#snippet header()}
		<HeaderBar balanced>
			{#snippet leftActions()}
				<IconButton
					label={language.listenAgainLabel}
					showLabel
					variant="solid"
					color="secondary"
					class="fl-repeat-btn"
					onclick={() => gameState.repeatTarget()}
				>
					{#snippet icon()}<SpeakerIcon size={28} />{/snippet}
				</IconButton>

				<Button
					variant="secondary"
					size="sm"
					class="fl-new-game"
					onclick={() => gameState.resetGame()}
				>
					{language.newGameLabel}
				</Button>
			{/snippet}

			{#snippet centerInfo()}
				<div class="title-wrap">
					<h1 class="title">{language.gameTitle}</h1>
					<p class="subtitle">{language.headerSubtitle}</p>
				</div>
			{/snippet}

			{#snippet rightActions()}
				<ScoreBadge label="{language.scoreLabel}:" value={gameState.score} class="fl-score" />

				<!-- כפתור הגדרות מוגן בסיסמה (AdminGate חוסם תלמידים) -->
				<AdminGate onUnlock={() => goto('/settings')}>
					<IconButton label={language.settingsLabel} variant="floating">
						{#snippet icon()}<SettingsIcon size={22} />{/snippet}
					</IconButton>
				</AdminGate>
			{/snippet}
		</HeaderBar>
	{/snippet}

	<div class="game-main">
		<!-- Progress Widget בצד הלוח (פינה שמאלית) — כמו במשחקים האחרים -->
		{#if settings.boosterEnabled && boosterConfig}
			<div class="progress-widget-pos">
				<ProgressWidget
					value={gameState.correctInCurrentSet}
					max={progressMax}
					orientation="vertical"
					label={language.progressLabel}
				/>
			</div>
		{/if}

		{#if gameState.status === 'IDLE'}
			<div class="empty">{language.startPrompt}</div>
		{:else}
			<Board
				board={gameState.board}
				shakingId={gameState.shakingId}
				{successId}
				disabled={isLocked}
				gridSize={settings.gridSize}
				onCardClick={(card) => gameState.handleClick(card)}
			/>
		{/if}

		<!-- overlay ספירה לאחור — מוצג מעל הלוח בלבד (position="absolute"; ה-header נשאר גלוי) -->
		{#if gameState.status === 'COOLDOWN'}
			<CooldownOverlay
				untilTs={gameState.cooldownUntilTs}
				durationMs={settings.cooldownMs}
				position="absolute"
				ariaLabel={language.cooldownTitle}
				message={language.cooldownHint}
			/>
		{/if}
	</div>
</GameShell>

<style>
	.game-main {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		box-sizing: border-box;
		min-height: 0;
		position: relative;
	}

	/* ProgressWidget מקובע בפינה השמאלית של אזור המשחק (RTL → "צד" של הלוח) */
	.progress-widget-pos {
		position: absolute;
		top: 1rem;
		left: 1rem;
		z-index: 20;
		pointer-events: auto;
	}

	.empty {
		font-size: 1.5rem;
		color: var(--theme-text-secondary);
		text-align: center;
	}

	.title-wrap {
		text-align: center;
	}

	.title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--theme-text-heading, var(--theme-brand-primary));
	}

	.subtitle {
		margin: 0;
		font-size: 0.85rem;
		color: var(--theme-text-secondary);
	}

	/*
	 * עיטורים מעל הקומפוננטות של הקיט (CSS של קומפוננטה אינו ב-@layer ולכן גובר על
	 * utilities של Tailwind): gradient ו-weight לכפתור "השמע שוב", גודל טקסט ל"משחק חדש",
	 * צבע ה-brand לניקוד.
	 */
	:global(.fl-repeat-btn) {
		background-image: linear-gradient(
			135deg,
			var(--theme-brand-secondary),
			var(--theme-brand-secondary-hover)
		);
		font-weight: 800;
		transition: transform 120ms ease;
	}

	:global(.fl-repeat-btn:hover) {
		transform: translateY(-1px);
	}

	:global(.fl-repeat-btn:active) {
		transform: translateY(0);
	}

	/* "משחק חדש" — טקסט בגודל רגיל (ה-sm של הקיט הוא text-sm) */
	:global(.fl-new-game) {
		font-size: 1rem;
	}

	:global(.fl-score) {
		color: var(--theme-brand-primary);
		font-weight: 800;
	}
</style>

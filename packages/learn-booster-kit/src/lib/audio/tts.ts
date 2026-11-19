/**
 * הקראת טקסט (TTS) — Fully Kiosk → Web Speech API → שקט.
 *
 * מחליף את העותקים המקומיים של `speakTTS` במשחקים (sort-cards, passcode, train-addition, wordys).
 * ההתנהגות זהה לעותקים:
 * - ב-Fully Kiosk: `fully.textToSpeech(text)`; Fully לא מדווח על סיום, לכן ה-Promise
 *   מתממש אחרי `fullyDelayMs` (ברירת מחדל 800ms).
 * - אחרת Web Speech: `he-IL`, קצב 0.9, `cancel()` לפני הקראה (interrupt), מתממש ב-end/error.
 * - בלי אף מנוע (SSR / דפדפן ללא תמיכה): מתממש מיד.
 *
 * ה-Promise תמיד מתממש — כדי לא לתקוע רצף משחק.
 */

/** ממשק מינימלי של Fully Kiosk ל-TTS. */
export interface FullyTts {
	textToSpeech(text: string, localeOrVoice?: string, engine?: string, queue?: boolean): void;
}

/** ממשק מינימלי של utterance (תת-קבוצה של SpeechSynthesisUtterance). */
export interface UtteranceLike {
	lang: string;
	rate: number;
	onend: ((ev: unknown) => unknown) | null;
	onerror: ((ev: unknown) => unknown) | null;
}

/** ממשק מינימלי של speechSynthesis. */
export interface SpeechSynthesisLike {
	speak(utterance: never): void;
	cancel(): void;
}

/** סביבת ההקראה — ברירת המחדל נקראת מ-window; בבדיקות מזריקים fakes. */
export interface TtsEnv {
	fully?: FullyTts;
	speechSynthesis?: SpeechSynthesisLike;
	createUtterance?: (text: string) => UtteranceLike;
}

export interface SpeakOptions {
	/** ברירת מחדל: `he-IL` */
	lang?: string;
	/** ברירת מחדל: 0.9 (מעט לאט, לבהירות) */
	rate?: number;
	/** לבטל הקראה קודמת לפני ההקראה (Web Speech). ברירת מחדל: true */
	interrupt?: boolean;
	/** להשתמש ב-Fully Kiosk כשזמין. ברירת מחדל: true */
	useFully?: boolean;
	/** כמה זמן "להחזיק" את ה-Promise ב-Fully (שאינו מדווח סיום). ברירת מחדל: 800ms */
	fullyDelayMs?: number;
	/** הזרקת סביבה (בדיקות). ברירת מחדל: `getDefaultTtsEnv()` */
	env?: TtsEnv;
}

/** קורא את מנועי ההקראה הזמינים מ-window (ריק ב-SSR). */
export function getDefaultTtsEnv(): TtsEnv {
	if (typeof window === 'undefined') return {};
	const w = window as unknown as {
		fully?: FullyTts;
		speechSynthesis?: SpeechSynthesisLike;
	};
	return {
		fully: w.fully,
		speechSynthesis: 'speechSynthesis' in window ? w.speechSynthesis : undefined,
		createUtterance:
			typeof SpeechSynthesisUtterance !== 'undefined'
				? (text) => new SpeechSynthesisUtterance(text)
				: undefined
	};
}

/** איזה מנוע ישמש להקראה (pure) — שימושי לבדיקות ולדיבאג. */
export function pickTtsEngine(env: TtsEnv, useFully = true): 'fully' | 'web-speech' | 'none' {
	if (useFully && env.fully) return 'fully';
	if (env.speechSynthesis && env.createUtterance) return 'web-speech';
	return 'none';
}

/** מקריא טקסט. מתממש בסיום ההקראה (או מיד כשאין מנוע). */
export function speakText(text: string, options: SpeakOptions = {}): Promise<void> {
	const {
		lang = 'he-IL',
		rate = 0.9,
		interrupt = true,
		useFully = true,
		fullyDelayMs = 800,
		env = getDefaultTtsEnv()
	} = options;

	return new Promise((resolve) => {
		const engine = pickTtsEngine(env, useFully);

		if (engine === 'fully') {
			try {
				env.fully!.textToSpeech(text);
			} catch (e) {
				console.warn('[tts] Fully textToSpeech failed:', e);
				resolve();
				return;
			}
			setTimeout(resolve, fullyDelayMs);
			return;
		}

		if (engine === 'none') {
			resolve();
			return;
		}

		const synth = env.speechSynthesis!;
		if (interrupt) synth.cancel();

		const utterance = env.createUtterance!(text);
		utterance.lang = lang;
		utterance.rate = rate;
		utterance.onend = () => resolve();
		utterance.onerror = () => resolve();

		synth.speak(utterance as never);
	});
}

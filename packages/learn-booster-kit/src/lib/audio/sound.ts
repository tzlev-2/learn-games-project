/**
 * צלילי משוב משותפים (playSuccess / playError / playWin) + השמעת קובץ אודיו כללי.
 *
 * כל משחק מגדיר את הנתיבים והעוצמות שלו — הקיט לא קובע איפה הקבצים יושבים
 * (`/sounds/success.mp3`, CDN משותף, manifest של assets וכו').
 *
 * התנהגות (זהה לעותקים שהיו במשחקים):
 * - כל השמעה יוצרת `Audio` חדש — צלילים חופפים לא קוטעים זה את זה.
 * - כשל השמעה (autoplay חסום, קובץ חסר) נרשם ב-console.warn ולא נזרק.
 * - בלי `Audio` גלובלי (SSR / node) — no-op.
 */

/** ממשק מינימלי של HTMLAudioElement — מאפשר הזרקה בבדיקות. */
export interface AudioLike {
	volume: number;
	play(): Promise<void> | void;
	onended: ((ev: Event) => unknown) | null;
	onerror: OnErrorEventHandler | ((ev: unknown) => unknown);
}

export type AudioFactory = (src: string) => AudioLike;

/**
 * הגדרת צליל.
 * `src` — URL קבוע, או פונקציה שמחזירה URL בזמן ההשמעה (למשל lookup ב-manifest);
 * `null`/`undefined` מהפונקציה = הצליל לא זמין → מדלגים בשקט (עם warn).
 */
export interface SoundDef {
	src: string | (() => string | null | undefined);
	/** 0..1. ברירת מחדל: 1 */
	volume?: number;
}

export interface SoundOptions {
	/** יצירת אלמנט אודיו. ברירת מחדל: `new Audio(src)` כשקיים בסביבה. */
	createAudio?: AudioFactory;
}

function defaultFactory(): AudioFactory | null {
	return typeof Audio !== 'undefined' ? (src) => new Audio(src) : null;
}

/** פותר את ה-URL של צליל (pure). */
export function resolveSoundSrc(def: SoundDef | undefined): string | null {
	if (!def) return null;
	const src = typeof def.src === 'function' ? def.src() : def.src;
	return src ? src : null;
}

/** מנגן צליל קצר (fire-and-forget). מחזיר `true` אם ההשמעה התחילה. */
function fire(def: SoundDef | undefined, name: string, options: SoundOptions): boolean {
	const src = resolveSoundSrc(def);
	if (!src) {
		if (def) console.warn(`[sound] "${name}" has no source`);
		return false;
	}
	const factory = options.createAudio ?? defaultFactory();
	if (!factory) return false;
	try {
		const audio = factory(src);
		audio.volume = def?.volume ?? 1;
		const p = audio.play();
		if (p && typeof p.catch === 'function') {
			p.catch((e) => console.warn(`[sound] failed to play "${name}"`, e));
		}
		return true;
	} catch (e) {
		console.warn(`[sound] error playing "${name}"`, e);
		return false;
	}
}

export interface SoundPlayer<K extends string> {
	/** מנגן צליל לפי שם. שם שלא הוגדר → no-op. */
	play(name: K): boolean;
	/** האם הוגדר צליל בשם הזה. */
	has(name: K): boolean;
}

/** נגן לסט צלילים בעלי שם. */
export function createSoundPlayer<K extends string>(
	defs: Partial<Record<K, SoundDef>>,
	options: SoundOptions = {}
): SoundPlayer<K> {
	return {
		play: (name) => fire(defs[name], name, options),
		has: (name) => defs[name] !== undefined
	};
}

/** שמות צלילי המשוב הסטנדרטיים. */
export type UiSoundName = 'success' | 'error' | 'win';

export interface UiSounds extends SoundPlayer<UiSoundName> {
	playSuccess(): void;
	playError(): void;
	/** no-op אם לא הוגדר צליל `win`. */
	playWin(): void;
}

/**
 * צלילי המשוב הסטנדרטיים של משחק.
 *
 * @example
 * export const { playSuccess, playError } = createUiSounds({
 *   success: { src: '/sounds/success.mp3', volume: 0.5 },
 *   error: { src: '/sounds/error.mp3', volume: 0.4 }
 * });
 */
export function createUiSounds(
	defs: Partial<Record<UiSoundName, SoundDef>>,
	options: SoundOptions = {}
): UiSounds {
	const player = createSoundPlayer<UiSoundName>(defs, options);
	return {
		...player,
		playSuccess: () => void player.play('success'),
		playError: () => void player.play('error'),
		playWin: () => void player.play('win')
	};
}

export interface PlayAudioOptions extends SoundOptions {
	/** 0..1. ברירת מחדל: 1 */
	volume?: number;
}

/**
 * מנגן קובץ אודיו ומחכה לסיומו.
 * ה-Promise תמיד מתממש (גם בשגיאה / autoplay חסום) — כדי לא לתקוע רצף משחק.
 */
export function playAudio(src: string, options: PlayAudioOptions = {}): Promise<void> {
	return new Promise((resolve) => {
		const factory = options.createAudio ?? defaultFactory();
		if (!factory) {
			resolve();
			return;
		}
		try {
			const audio = factory(src);
			audio.volume = options.volume ?? 1;
			audio.onended = () => resolve();
			audio.onerror = (e: unknown) => {
				console.warn('[sound] playback failed:', e);
				resolve();
			};
			const p = audio.play();
			if (p && typeof p.catch === 'function') {
				p.catch((e) => {
					console.warn('[sound] play failed:', e);
					resolve();
				});
			}
		} catch (e) {
			console.warn('[sound] error in playAudio:', e);
			resolve();
		}
	});
}

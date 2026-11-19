/**
 * הקלטות קוליות מוכנות מראש עם fallback ל-TTS.
 *
 * חולץ מ-train-addition-game: כל נכס קולי הוא קובץ (`<baseUrl><file><extension>`) + הטקסט שלו.
 * הקבצים נטענים ומפוענחים פעם אחת לזיכרון (Web Audio `AudioBuffer`), כך שהשמעה חוזרת מיידית.
 * נכס שעוד לא נטען (לפני סיום ה-preload / שגיאת טעינה) מוקרא ב-TTS מהטקסט שלו.
 */

import { speakText } from './tts';

export interface VoiceAsset {
	/** שם הקובץ בלי סיומת, יחסית ל-`baseUrl` */
	file: string;
	/** הטקסט — ל-fallback ב-TTS */
	text: string;
}

/** ממשק מינימלי של AudioBuffer. */
export type DecodedAudio = object;

/** ממשק מינימלי של AudioContext — מאפשר הזרקה בבדיקות. */
export interface AudioContextLike {
	state: string;
	resume(): Promise<void> | void;
	decodeAudioData(data: ArrayBuffer): Promise<DecodedAudio>;
	/** מנגן buffer ומתממש בסיום. */
	play(buffer: DecodedAudio): Promise<void>;
}

export interface VoiceAssetDeps {
	fetch?: (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>;
	createAudioContext?: () => AudioContextLike;
	/** תזמון הטעינה ברקע. ברירת מחדל: requestIdleCallback, או setTimeout(2000). */
	scheduleIdle?: (cb: () => void) => void;
	speak?: (text: string) => Promise<void>;
}

export interface VoiceAssetPlayerOptions<K extends string> {
	assets: Record<K, VoiceAsset>;
	/** למשל `/sounds/` */
	baseUrl: string;
	/** ברירת מחדל: `.mp3` */
	extension?: string;
	/** לדלג על ההקלטות ולהקריא הכל ב-TTS (בדיקות / אין קבצים). */
	forceTts?: boolean;
	deps?: VoiceAssetDeps;
}

export interface VoiceAssetPlayer<K extends string> {
	/** טוען את כל הקבצים לזיכרון ברקע. קריאה חוזרת — no-op. */
	preload(): void;
	/** מחכה לסיום ה-preload (אם התחיל). */
	whenPreloaded(): Promise<void>;
	/** משמיע נכס (הקלטה מה-cache או TTS). מפתח לא מוכר / null → no-op. */
	play(key: K | null | undefined): Promise<void>;
	/** משמיע רצף נכסים, אחד אחרי השני. */
	playSequence(keys: readonly K[]): Promise<void>;
	/** האם המפתח מוגדר. */
	has(key: string): key is K;
	/** הטקסט של נכס. */
	text(key: K): string;
	/** האם ההקלטה כבר בזיכרון. */
	isLoaded(key: K): boolean;
	/** מקריא טקסט חופשי ב-TTS. */
	speak(text: string): Promise<void>;
}

/** בונה את ה-URL של קובץ נכס (pure). */
export function voiceAssetUrl(asset: VoiceAsset, baseUrl: string, extension = '.mp3'): string {
	return `${baseUrl}${asset.file}${extension}`;
}

function defaultAudioContext(): AudioContextLike | null {
	const Ctor =
		typeof AudioContext !== 'undefined'
			? AudioContext
			: typeof window !== 'undefined'
				? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
				: undefined;
	if (!Ctor) return null;
	const ctx = new Ctor();
	return {
		get state() {
			return ctx.state;
		},
		resume: () => ctx.resume(),
		decodeAudioData: (data) => ctx.decodeAudioData(data),
		play: (buffer) =>
			new Promise<void>((resolve) => {
				const source = ctx.createBufferSource();
				source.buffer = buffer as AudioBuffer;
				source.connect(ctx.destination);
				source.onended = () => resolve();
				source.start(0);
			})
	};
}

function defaultScheduleIdle(cb: () => void): void {
	if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
		window.requestIdleCallback(cb);
	} else {
		setTimeout(cb, 2000);
	}
}

export function createVoiceAssetPlayer<K extends string>(
	options: VoiceAssetPlayerOptions<K>
): VoiceAssetPlayer<K> {
	const { assets, baseUrl, extension = '.mp3', forceTts = false, deps = {} } = options;
	const speak = deps.speak ?? ((text: string) => speakText(text));
	const cache = new Map<K, DecodedAudio>();
	let ctx: AudioContextLike | null = null;
	let preloadDone: Promise<void> | null = null;

	function getContext(): AudioContextLike | null {
		if (!ctx) ctx = deps.createAudioContext ? deps.createAudioContext() : defaultAudioContext();
		if (ctx && ctx.state === 'suspended') void ctx.resume();
		return ctx;
	}

	const has = (key: string): key is K => Object.prototype.hasOwnProperty.call(assets, key);

	async function play(key: K | null | undefined): Promise<void> {
		if (!key || !has(key)) return;
		const asset = assets[key];
		if (forceTts) {
			await speak(asset.text);
			return;
		}
		const buffer = cache.get(key);
		const context = buffer ? getContext() : null;
		if (buffer && context) {
			await context.play(buffer);
			return;
		}
		// fallback ל-TTS — הקובץ עוד לא נטען או נכשל
		await speak(asset.text);
	}

	function preload(): void {
		if (preloadDone) return;
		const fetchFn = deps.fetch ?? (typeof fetch !== 'undefined' ? fetch : undefined);
		if (!fetchFn) return;
		const schedule =
			deps.scheduleIdle ?? (typeof window !== 'undefined' ? defaultScheduleIdle : undefined);
		if (!schedule) return;

		const load = async () => {
			const context = getContext();
			if (!context) return;
			const entries = Object.entries(assets) as [K, VoiceAsset][];
			await Promise.allSettled(
				entries.map(async ([key, asset]) => {
					try {
						const res = await fetchFn(voiceAssetUrl(asset, baseUrl, extension));
						if (!res.ok) return;
						const decoded = await context.decodeAudioData(await res.arrayBuffer());
						cache.set(key, decoded);
					} catch {
						// קובץ חסר / שגיאת פענוח — יוקרא ב-TTS בעת ההשמעה
					}
				})
			);
		};

		preloadDone = new Promise<void>((resolve) => {
			schedule(() => {
				load().finally(resolve);
			});
		});
	}

	return {
		preload,
		whenPreloaded: () => preloadDone ?? Promise.resolve(),
		play,
		async playSequence(keys) {
			for (const key of keys) await play(key);
		},
		has,
		text: (key) => assets[key].text,
		isLoaded: (key) => cache.has(key),
		speak
	};
}

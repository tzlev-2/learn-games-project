/** בדיקות node ל-createVoiceAssetPlayer: preload, cache, fallback ל-TTS, רצפים. */
import { describe, it, expect, vi } from 'vitest';
import {
	createVoiceAssetPlayer,
	voiceAssetUrl,
	type AudioContextLike
} from '../../src/lib/audio/voice-assets';
import * as kit from '../../src/index';

const ASSETS = {
	one: { file: '1', text: 'אחד' },
	two: { file: '2', text: 'שתיים' },
	missing: { file: 'missing', text: 'חסר' }
} as const;

function setup(opts: { forceTts?: boolean } = {}) {
	const log: string[] = [];
	let state = 'suspended';
	const ctx: AudioContextLike = {
		get state() {
			return state;
		},
		resume: () => {
			state = 'running';
			log.push('resume');
		},
		decodeAudioData: async (data) => ({ decoded: new TextDecoder().decode(data) }),
		play: async (buffer) => {
			log.push(`play:${(buffer as { decoded: string }).decoded}`);
		}
	};
	const fetchFn = vi.fn(async (url: string) => ({
		ok: !url.includes('missing'),
		arrayBuffer: async () => new TextEncoder().encode(url).buffer as ArrayBuffer
	}));
	const player = createVoiceAssetPlayer({
		assets: ASSETS,
		baseUrl: '/sounds/',
		forceTts: opts.forceTts,
		deps: {
			fetch: fetchFn,
			createAudioContext: () => ctx,
			scheduleIdle: (cb) => cb(),
			speak: async (text) => {
				log.push(`tts:${text}`);
			}
		}
	});
	return { player, log, fetchFn };
}

describe('voiceAssetUrl', () => {
	it('baseUrl + file + extension', () => {
		expect(voiceAssetUrl({ file: 'put_1_cars', text: '' }, '/sounds/')).toBe('/sounds/put_1_cars.mp3');
		expect(voiceAssetUrl({ file: 'a', text: '' }, '/s/', '.wav')).toBe('/s/a.wav');
	});
});

describe('createVoiceAssetPlayer', () => {
	it('לפני preload — fallback ל-TTS מהטקסט', async () => {
		const { player, log } = setup();
		await player.play('one');
		expect(log).toEqual(['tts:אחד']);
	});

	it('אחרי preload — מנגן מה-cache; קובץ חסר נופל ל-TTS', async () => {
		const { player, log, fetchFn } = setup();
		player.preload();
		await player.whenPreloaded();
		expect(fetchFn).toHaveBeenCalledTimes(3);
		expect(player.isLoaded('one')).toBe(true);
		expect(player.isLoaded('missing')).toBe(false);
		log.length = 0;
		await player.playSequence(['one', 'missing', 'two']);
		expect(log).toEqual(['play:/sounds/1.mp3', 'tts:חסר', 'play:/sounds/2.mp3']);
	});

	it('preload פעם אחת בלבד', async () => {
		const { player, fetchFn } = setup();
		player.preload();
		player.preload();
		await player.whenPreloaded();
		expect(fetchFn).toHaveBeenCalledTimes(3);
	});

	it('AudioContext מושהה מתחדש', async () => {
		const { player, log } = setup();
		player.preload();
		await player.whenPreloaded();
		expect(log).toContain('resume');
	});

	it('forceTts — תמיד TTS', async () => {
		const { player, log } = setup({ forceTts: true });
		player.preload();
		await player.whenPreloaded();
		log.length = 0;
		await player.play('one');
		expect(log).toEqual(['tts:אחד']);
	});

	it('מפתח לא מוכר / null — no-op; has/text', async () => {
		const { player, log } = setup();
		await player.play(null);
		await player.play('nope' as never);
		expect(log).toEqual([]);
		expect(player.has('one')).toBe(true);
		expect(player.has('nope')).toBe(false);
		expect(player.text('two')).toBe('שתיים');
	});

	it('speak — TTS חופשי', async () => {
		const { player, log } = setup();
		await player.speak('שלום');
		expect(log).toEqual(['tts:שלום']);
	});

	it('בלי fetch / scheduler (SSR) — preload לא עושה כלום', async () => {
		const player = createVoiceAssetPlayer({
			assets: ASSETS,
			baseUrl: '/',
			deps: { speak: async () => {} }
		});
		player.preload();
		await expect(player.whenPreloaded()).resolves.toBeUndefined();
	});

	it('מיוצא מ-index', () => {
		expect(kit.createVoiceAssetPlayer).toBe(createVoiceAssetPlayer);
	});
});

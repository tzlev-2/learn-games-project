/** בדיקות node ל-sound: createUiSounds / createSoundPlayer / playAudio עם Audio מוזרק. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	createUiSounds,
	createSoundPlayer,
	playAudio,
	resolveSoundSrc,
	type AudioLike
} from '../../src/lib/audio/sound';
import * as kit from '../../src/index';

interface FakeAudio extends AudioLike {
	src: string;
	played: number;
}

function fakeFactory(behaviour: 'ok' | 'reject' | 'throw' = 'ok') {
	const created: FakeAudio[] = [];
	const factory = (src: string): FakeAudio => {
		if (behaviour === 'throw') throw new Error('boom');
		const a: FakeAudio = {
			src,
			volume: 1,
			played: 0,
			onended: null,
			onerror: null,
			play() {
				a.played++;
				return behaviour === 'reject' ? Promise.reject(new Error('blocked')) : Promise.resolve();
			}
		};
		created.push(a);
		return a;
	};
	return { factory, created };
}

afterEach(() => vi.restoreAllMocks());

describe('resolveSoundSrc', () => {
	it('מחרוזת, פונקציה, ו-null', () => {
		expect(resolveSoundSrc({ src: '/a.mp3' })).toBe('/a.mp3');
		expect(resolveSoundSrc({ src: () => '/b.mp3' })).toBe('/b.mp3');
		expect(resolveSoundSrc({ src: () => null })).toBeNull();
		expect(resolveSoundSrc({ src: '' })).toBeNull();
		expect(resolveSoundSrc(undefined)).toBeNull();
	});
});

describe('createUiSounds', () => {
	it('playSuccess/playError מנגנים את הנתיב והעוצמה שהוגדרו, Audio חדש בכל השמעה', () => {
		const { factory, created } = fakeFactory();
		const s = createUiSounds(
			{
				success: { src: '/sounds/success.mp3', volume: 0.5 },
				error: { src: '/sounds/error.mp3', volume: 0.4 }
			},
			{ createAudio: factory }
		);
		s.playSuccess();
		s.playSuccess();
		s.playError();
		expect(created.map((a) => [a.src, a.volume, a.played])).toEqual([
			['/sounds/success.mp3', 0.5, 1],
			['/sounds/success.mp3', 0.5, 1],
			['/sounds/error.mp3', 0.4, 1]
		]);
	});

	it('playWin בלי הגדרה — no-op', () => {
		const { factory, created } = fakeFactory();
		const s = createUiSounds({ success: { src: '/s.mp3' } }, { createAudio: factory });
		s.playWin();
		expect(created).toHaveLength(0);
		expect(s.has('win')).toBe(false);
		expect(s.has('success')).toBe(true);
	});

	it('src כפונקציה נפתר בזמן ההשמעה; null → מדלג עם warn', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { factory, created } = fakeFactory();
		let url: string | null = null;
		const s = createUiSounds({ success: { src: () => url } }, { createAudio: factory });
		s.playSuccess();
		expect(created).toHaveLength(0);
		expect(warn).toHaveBeenCalled();
		url = '/late.mp3';
		s.playSuccess();
		expect(created[0].src).toBe('/late.mp3');
	});

	it('play שנדחה (autoplay חסום) לא זורק', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { factory } = fakeFactory('reject');
		const s = createUiSounds({ error: { src: '/e.wav' } }, { createAudio: factory });
		expect(() => s.playError()).not.toThrow();
		await Promise.resolve();
		await Promise.resolve();
		expect(warn).toHaveBeenCalled();
	});

	it('factory שזורק — לא זורק החוצה', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { factory } = fakeFactory('throw');
		const s = createUiSounds({ error: { src: '/e.wav' } }, { createAudio: factory });
		expect(() => s.playError()).not.toThrow();
	});

	it('בלי Audio גלובלי (node) — no-op', () => {
		const s = createUiSounds({ success: { src: '/s.mp3' } });
		expect(s.play('success')).toBe(false);
	});
});

describe('createSoundPlayer', () => {
	it('שמות מותאמים אישית', () => {
		const { factory, created } = fakeFactory();
		const p = createSoundPlayer<'pop' | 'whoosh'>({ pop: { src: '/pop.mp3' } }, { createAudio: factory });
		expect(p.play('pop')).toBe(true);
		expect(p.play('whoosh')).toBe(false);
		expect(created).toHaveLength(1);
	});
});

describe('playAudio', () => {
	it('מתממש ב-onended, עוצמה ברירת מחדל 1', async () => {
		const { factory, created } = fakeFactory();
		const p = playAudio('/word.mp3', { createAudio: factory });
		expect(created[0].volume).toBe(1);
		created[0].onended!(new Event('ended'));
		await expect(p).resolves.toBeUndefined();
	});

	it('מתממש גם בשגיאה ובדחייה', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const a = fakeFactory();
		const p1 = playAudio('/x.mp3', { createAudio: a.factory, volume: 0.3 });
		expect(a.created[0].volume).toBe(0.3);
		(a.created[0].onerror as (e: unknown) => void)('err');
		await expect(p1).resolves.toBeUndefined();

		const b = fakeFactory('reject');
		await expect(playAudio('/y.mp3', { createAudio: b.factory })).resolves.toBeUndefined();

		const c = fakeFactory('throw');
		await expect(playAudio('/z.mp3', { createAudio: c.factory })).resolves.toBeUndefined();
	});

	it('בלי Audio גלובלי — מתממש מיד', async () => {
		await expect(playAudio('/x.mp3')).resolves.toBeUndefined();
	});
});

describe('exports', () => {
	it('מיוצא מ-index', () => {
		expect(kit.createUiSounds).toBe(createUiSounds);
		expect(kit.playAudio).toBe(playAudio);
		expect(typeof kit.shuffleArray).toBe('function');
	});
});

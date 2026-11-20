/** בדיקות node ל-speakText: Fully → Web Speech → שקט, עם סביבה מוזרקת. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	speakText,
	pickTtsEngine,
	getDefaultTtsEnv,
	type TtsEnv,
	type UtteranceLike
} from '../../src/lib/audio/tts';
import * as kit from '../../src/index';

interface FakeUtterance extends UtteranceLike {
	text: string;
}

function webSpeechEnv() {
	const spoken: FakeUtterance[] = [];
	const calls: string[] = [];
	const env: TtsEnv = {
		speechSynthesis: {
			cancel: () => calls.push('cancel'),
			speak: (u: never) => {
				calls.push('speak');
				spoken.push(u as FakeUtterance);
			}
		},
		createUtterance: (text) => ({ text, lang: '', rate: 1, onend: null, onerror: null }) as FakeUtterance
	};
	return { env, spoken, calls };
}

afterEach(() => {
	vi.useRealTimers();
});

describe('pickTtsEngine', () => {
	it('Fully קודם, אחר כך Web Speech, אחרת none', () => {
		const fully = { textToSpeech: () => {} };
		const { env } = webSpeechEnv();
		expect(pickTtsEngine({ ...env, fully })).toBe('fully');
		expect(pickTtsEngine({ ...env, fully }, false)).toBe('web-speech');
		expect(pickTtsEngine(env)).toBe('web-speech');
		expect(pickTtsEngine({})).toBe('none');
		expect(pickTtsEngine({ speechSynthesis: env.speechSynthesis })).toBe('none');
	});
});

describe('speakText', () => {
	it('Web Speech: he-IL, קצב 0.9, cancel לפני speak, מתממש ב-onend', async () => {
		const { env, spoken, calls } = webSpeechEnv();
		const p = speakText('כל הכבוד!', { env });
		expect(calls).toEqual(['cancel', 'speak']);
		expect(spoken[0]).toMatchObject({ text: 'כל הכבוד!', lang: 'he-IL', rate: 0.9 });
		spoken[0].onend!({});
		await expect(p).resolves.toBeUndefined();
	});

	it('interrupt=false לא מבטל; onerror מממש', async () => {
		const { env, spoken, calls } = webSpeechEnv();
		const p = speakText('א', { env, interrupt: false, lang: 'en-US', rate: 1.2 });
		expect(calls).toEqual(['speak']);
		expect(spoken[0]).toMatchObject({ lang: 'en-US', rate: 1.2 });
		spoken[0].onerror!({});
		await expect(p).resolves.toBeUndefined();
	});

	it('Fully: textToSpeech(text) ומתממש אחרי fullyDelayMs', async () => {
		vi.useFakeTimers();
		const fully = { textToSpeech: vi.fn() };
		const { env, calls } = webSpeechEnv();
		let done = false;
		const p = speakText('שלום', { env: { ...env, fully } }).then(() => (done = true));
		expect(fully.textToSpeech).toHaveBeenCalledWith('שלום');
		expect(calls).toEqual([]);
		await vi.advanceTimersByTimeAsync(799);
		expect(done).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		await p;
		expect(done).toBe(true);
	});

	it('useFully=false עוקף את Fully', () => {
		const fully = { textToSpeech: vi.fn() };
		const { env, calls } = webSpeechEnv();
		void speakText('x', { env: { ...env, fully }, useFully: false });
		expect(fully.textToSpeech).not.toHaveBeenCalled();
		expect(calls).toContain('speak');
	});

	it('Fully שזורק — מתממש ולא זורק', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fully = {
			textToSpeech: () => {
				throw new Error('x');
			}
		};
		await expect(speakText('x', { env: { fully } })).resolves.toBeUndefined();
	});

	it('בלי מנוע — מתממש מיד', async () => {
		await expect(speakText('x', { env: {} })).resolves.toBeUndefined();
	});

	it('סביבת ברירת מחדל ב-node ריקה', async () => {
		expect(getDefaultTtsEnv()).toEqual({});
		await expect(speakText('x')).resolves.toBeUndefined();
	});

	it('מיוצא מ-index', () => {
		expect(kit.speakText).toBe(speakText);
	});
});

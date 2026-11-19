/**
 * ה-Provider המשותף "אותיות וניקוד" (platform-plan שלבים 3–4):
 * צירים, deck קרטזי, חוקי תקפות, הקראה, דמיון, ושיתוף בין שני משחקים.
 */
import { describe, it, expect } from 'vitest';
import {
	hebrewLettersProvider,
	createHebrewLettersProvider,
	isValidHebrewCombination,
	isValidLetterVowel,
	hasRecordedSpeech,
	areSimilar,
	makePair,
	lookupLetter,
	lookupVowel,
	LETTERS_BY_LEGACY_ID,
	VOWELS_BY_CODE,
	ALL_VOWELS,
	DEFAULT_LETTER_IDS,
	HEBREW_LETTERS_PROVIDER_ID,
	hebrewLettersLanguage,
	type Letter
} from '../../../src/content/providers/hebrew-letters';
import { content } from '../../src';
import { generateDeck } from './helpers';

const { isContentProvider, validateSelection, createContentRegistry, resolveGameContent } = content;

const provider = hebrewLettersProvider;
const [lettersAxis, vowelsAxis] = provider.selectionAxes;

describe('hebrewLettersProvider — מבנה', () => {
	it('עומד בחוזה ContentProvider עם id יציב', () => {
		expect(isContentProvider(provider)).toBe(true);
		expect(provider.id).toBe(HEBREW_LETTERS_PROVIDER_ID);
		expect(provider.id).toBe('hebrew-letters');
		expect(provider.displayName).toBe(hebrewLettersLanguage.providerName);
		expect(provider.icon).toBe(hebrewLettersLanguage.providerIcon);
	});

	it('שני צירים: letters (26, סדר א-ב, מינימום 2) ו-vowels (10, סדר פדגוגי, מינימום 1)', () => {
		expect(provider.selectionAxes.map((a) => a.id)).toEqual(['letters', 'vowels']);
		const letterIds = lettersAxis.getAvailableItems().map((i) => i.id);
		expect(letterIds).toEqual([...DEFAULT_LETTER_IDS]);
		expect(letterIds.slice(0, 3)).toEqual(['a', 'ba', 'va_rafe']);
		expect(lettersAxis.minSelected).toBe(2);
		expect(vowelsAxis.getAvailableItems().map((i) => i.id)).toEqual(ALL_VOWELS.map((v) => v.code));
		expect(vowelsAxis.minSelected).toBe(1);
	});

	it('label של פריט: האות לתצוגה / שם הניקוד', () => {
		const ba = lettersAxis.getAvailableItems().find((i) => i.id === 'ba')!;
		expect(ba.label).toBe('בּ');
		const hirik = vowelsAxis.getAvailableItems().find((i) => i.id === 'hirik')!;
		expect(hirik.label).toBe('חיריק');
	});

	it('getAvailableItems מחזיר מערך חדש בכל קריאה', () => {
		expect(lettersAxis.getAvailableItems()).not.toBe(lettersAxis.getAvailableItems());
	});

	it('בחירת ברירת המחדל: כל 26 האותיות + פתח (ההתנהגות ההיסטורית של find-letter), ועוברת validateSelection', () => {
		const sel = provider.getDefaultSelection();
		expect(sel).toEqual({ letters: [...DEFAULT_LETTER_IDS], vowels: ['patah'] });
		expect(provider.getDefaultSelection()).not.toBe(sel);
		expect(validateSelection(provider.selectionAxes, sel).isOk()).toBe(true);
	});

	it('validateSelection: אות אחת או אפס ניקודים — מתחת למינימום', () => {
		expect(validateSelection(provider.selectionAxes, { letters: ['ba'], vowels: ['patah'] }).isErr()).toBe(true);
		expect(validateSelection(provider.selectionAxes, { letters: ['ba', 'ga'], vowels: [] }).isErr()).toBe(true);
	});
});

describe('hebrewLettersProvider — deck', () => {
	it('מכפלה קרטזית: אותיות × ניקודים, מזהה פריט = pair.id', () => {
		const deck = provider.generateDeck({ letters: ['ba', 'ga'], vowels: ['patah', 'hirik'] }, {});
		expect(deck.map((i) => i.id)).toEqual(['ba', 'b__hirik', 'ga', 'g__hirik']);
		for (const item of deck) {
			expect(item.value.id).toBe(item.id);
			expect(item.label).toBe(item.value.display);
		}
	});

	it('הסדר לפי סדר הצירים, לא לפי סדר הבחירה', () => {
		const deck = provider.generateDeck({ letters: ['ga', 'ba'], vowels: ['hirik', 'patah'] }, {});
		expect(deck.map((i) => i.id)).toEqual(['ba', 'b__hirik', 'ga', 'g__hirik']);
	});

	it('הפריטים זהים ל-makePair (אותם display / speak)', () => {
		for (const item of provider.generateDeck(provider.getDefaultSelection(), {})) {
			const pair = makePair(LETTERS_BY_LEGACY_ID.get(item.value.letter.legacyCardId)!, VOWELS_BY_CODE[item.value.vowel.code]);
			expect(item.value).toEqual(pair);
		}
	});

	it('כל 26×10 הצירופים תקפים (אין סופיות במאגר) — 260 פריטים', () => {
		const all = provider.generateDeck(
			{ letters: [...DEFAULT_LETTER_IDS], vowels: ALL_VOWELS.map((v) => v.code) },
			{}
		);
		expect(all).toHaveLength(260);
		expect(new Set(all.map((i) => i.id)).size).toBe(260);
	});

	it('ציר ריק → deck ריק; מזהים לא מוכרים נזרקים', () => {
		expect(provider.generateDeck({ letters: ['ba'], vowels: [] }, {})).toEqual([]);
		expect(provider.generateDeck({ letters: [], vowels: ['patah'] }, {})).toEqual([]);
		expect(provider.generateDeck({}, {})).toEqual([]);
		expect(provider.generateDeck({ letters: ['ba', 'ghost'], vowels: ['patah', 'ghost'] }, {}).map((i) => i.id)).toEqual(['ba']);
	});

	it('צירופים בלי הקלטה (גרוניות + שווא/עיצור) נשארים ב-deck — fallback ל-Web Speech כמו קודם', () => {
		const deck = generateDeck(['a', 'aa', 'ba'], ['shva', 'none']);
		const noAudio = deck.filter((p) => !hasRecordedSpeech(p.speak)).map((p) => p.id);
		expect(noAudio.sort()).toEqual(['a__none', 'a__shva', 'aa__none', 'aa__shva']);
		expect(deck).toHaveLength(6);
	});

	it('generateDeck טהור — לא משנה את הבחירה', () => {
		const sel = { letters: ['ba', 'ga'], vowels: ['patah'] };
		const copy = structuredClone(sel);
		provider.generateDeck(sel, {});
		expect(sel).toEqual(copy);
	});
});

describe('isValidCombination', () => {
	it('צירוף מוכר — תקף; מזהה לא מוכר בכל ציר — לא תקף', () => {
		expect(provider.isValidCombination!({ letters: 'ba', vowels: 'hirik' })).toBe(true);
		expect(isValidHebrewCombination({ letters: 'ghost', vowels: 'patah' })).toBe(false);
		expect(isValidHebrewCombination({ letters: 'ba', vowels: 'ghost' })).toBe(false);
		expect(isValidHebrewCombination({ letters: 'ba' })).toBe(false);
		// מפתחות של Object.prototype אינם ניקוד
		expect(isValidHebrewCombination({ letters: 'ba', vowels: 'toString' })).toBe(false);
	});

	it('סופית + שווא/עיצור — פסולה; סופית + תנועה — תקפה (vowels-support-plan §9)', () => {
		const finalKaf: Letter = { ...LETTERS_BY_LEGACY_ID.get('ka')!, id: 'k_final', displayChar: 'ך', isFinalForm: true, legacyCardId: 'ka_final' };
		expect(isValidLetterVowel(finalKaf, VOWELS_BY_CODE.shva)).toBe(false);
		expect(isValidLetterVowel(finalKaf, VOWELS_BY_CODE.none)).toBe(false);
		expect(isValidLetterVowel(finalKaf, VOWELS_BY_CODE.kamatz)).toBe(true);
		expect(isValidLetterVowel(LETTERS_BY_LEGACY_ID.get('ka')!, VOWELS_BY_CODE.shva)).toBe(true);
	});

	it('lookupLetter / lookupVowel', () => {
		expect(lookupLetter('va_rafe')?.displayChar).toBe('ב');
		expect(lookupLetter('nope')).toBeUndefined();
		expect(lookupVowel('kubutz')?.code).toBe('kubutz');
		expect(lookupVowel('constructor')).toBeUndefined();
	});
});

describe('הקראה, דמיון, כרטיס', () => {
	const [ba, sa, saSin, bHirik] = provider
		.generateDeck({ letters: ['ba', 'sa', 'sa_sin'], vowels: ['patah', 'hirik'] }, {})
		.filter((i) => ['ba', 'sa', 'sa_sin', 'b__hirik'].includes(i.id))
		.sort((x, y) => ['ba', 'sa', 'sa_sin', 'b__hirik'].indexOf(x.id) - ['ba', 'sa', 'sa_sin', 'b__hirik'].indexOf(y.id));

	it('getSpeakText = pair.speak (הטקסט שממופה ל-MP3)', () => {
		expect(provider.getSpeakText!(ba)).toBe('בָּא');
		expect(provider.getSpeakText!(bHirik)).toBe(bHirik.value.speak);
	});

	it('areItemsSimilar = areSimilar לפי מזהה הצירוף (כמו find-letter לפני ה-Provider)', () => {
		expect(provider.areItemsSimilar!(sa, saSin)).toBe(true);
		expect(provider.areItemsSimilar!(ba, sa)).toBe(false);
		expect(provider.areItemsSimilar!(ba, ba)).toBe(true);
		expect(provider.areItemsSimilar!(ba, bHirik)).toBe(areSimilar('ba', 'b__hirik'));
	});

	it('generateCardContent + contentMatches לפי itemId ו-providerId', () => {
		const a = provider.generateCardContent(ba, {});
		const b = provider.generateCardContent(ba, {});
		const c = provider.generateCardContent(bHirik, {});
		expect(a).toEqual({ providerId: 'hebrew-letters', itemId: 'ba', data: ba.value });
		expect(provider.contentMatches(a, b)).toBe(true);
		expect(provider.contentMatches(a, c)).toBe(false);
		expect(provider.contentMatches(a, { ...b, providerId: 'letters' })).toBe(false);
	});
});

describe('תוכן אחד, כמה משחקים', () => {
	it('אותו אובייקט נרשם ונפתר בשני registries של שני משחקים', () => {
		const findLetterRegistry = createContentRegistry([provider]);
		const lottoRegistry = createContentRegistry([provider]);
		const findLetter = resolveGameContent(findLetterRegistry, {
			gameId: 'find-letter-game',
			providerIds: ['hebrew-letters'],
			defaultProviderId: 'hebrew-letters'
		});
		const lotto = resolveGameContent(lottoRegistry, {
			gameId: 'lotto-game',
			providerIds: ['hebrew-letters'],
			defaultProviderId: 'hebrew-letters'
		});
		expect(findLetter.isOk() && lotto.isOk()).toBe(true);
		const a = findLetter._unsafeUnwrap().getProvider('hebrew-letters');
		const b = lotto._unsafeUnwrap().getProvider('hebrew-letters');
		expect(a).toBe(provider);
		expect(b).toBe(provider);
	});

	it('createHebrewLettersProvider: שמות אחרים, אותו תוכן', () => {
		const custom = createHebrewLettersProvider({ labels: { providerName: 'X', lettersAxis: 'L' }, icon: '★' });
		expect(custom.displayName).toBe('X');
		expect(custom.icon).toBe('★');
		expect(custom.selectionAxes[0].displayName).toBe('L');
		expect(custom.selectionAxes[1].displayName).toBe(hebrewLettersLanguage.axes.vowels);
		const sel = custom.getDefaultSelection();
		expect(custom.generateDeck(sel, {})).toEqual(provider.generateDeck(sel, {}));
	});
});

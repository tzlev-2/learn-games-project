import { describe, it, expect } from 'vitest';
import { content } from '../src';
import { lettersAxis, noFinalWithShva, optionalAxis, vowelsAxis } from './fixtures';

const { selectAxisItems, combinationIds, combinationKey, cartesianCombinations, generateCartesianDeck } =
  content;

const ids = (combos: ReturnType<typeof cartesianCombinations>) => combos.map(combinationIds);

describe('selectAxisItems', () => {
  it('מחזיר פריטים נבחרים לפי סדר הציר ומתעלם ממזהים לא מוכרים', () => {
    const result = selectAxisItems(lettersAxis, { letters: ['final-k', 'ghost', 'a'] });
    expect(result.map((i) => i.id)).toEqual(['a', 'final-k']);
  });

  it('ציר חסר בבחירה → מערך ריק', () => {
    expect(selectAxisItems(lettersAxis, {})).toEqual([]);
  });
});

describe('cartesianCombinations', () => {
  it('ציר יחיד → צירוף לכל פריט', () => {
    expect(ids(cartesianCombinations([lettersAxis], { letters: ['a', 'b'] }))).toEqual([
      { letters: 'a' },
      { letters: 'b' },
    ]);
  });

  it('שני צירים → מכפלה מלאה, הציר הראשון חיצוני', () => {
    const result = cartesianCombinations([lettersAxis, vowelsAxis], {
      letters: ['a', 'b'],
      vowels: ['kamatz', 'shva'],
    });
    expect(ids(result)).toEqual([
      { letters: 'a', vowels: 'kamatz' },
      { letters: 'a', vowels: 'shva' },
      { letters: 'b', vowels: 'kamatz' },
      { letters: 'b', vowels: 'shva' },
    ]);
    // הצירוף מכיל את ה-ContentItem המלא
    expect(result[0].letters).toEqual({ id: 'a', value: 'a', label: 'label-a' });
  });

  it('סינון לפי isValid (סופית + שווא)', () => {
    const result = cartesianCombinations(
      [lettersAxis, vowelsAxis],
      { letters: ['a', 'final-k'], vowels: ['kamatz', 'shva'] },
      noFinalWithShva,
    );
    expect(ids(result)).toEqual([
      { letters: 'a', vowels: 'kamatz' },
      { letters: 'a', vowels: 'shva' },
      { letters: 'final-k', vowels: 'kamatz' },
    ]);
  });

  it('שלושה צירים → 2×2×2 = 8', () => {
    const result = cartesianCombinations([lettersAxis, vowelsAxis, optionalAxis], {
      letters: ['a', 'b'],
      vowels: ['kamatz', 'patah'],
      extras: ['x', 'y'],
    });
    expect(result).toHaveLength(8);
    expect(combinationIds(result[7])).toEqual({ letters: 'b', vowels: 'patah', extras: 'y' });
  });

  it('ציר חובה ריק → אין צירופים', () => {
    expect(cartesianCombinations([lettersAxis, vowelsAxis], { letters: ['a'] })).toEqual([]);
  });

  it('ציר ריק עם allowEmpty לא משתתף', () => {
    const result = cartesianCombinations([lettersAxis, optionalAxis], { letters: ['a', 'b'] });
    expect(ids(result)).toEqual([{ letters: 'a' }, { letters: 'b' }]);
  });

  it('אין צירים / כל הצירים ריקים-מותרים → מערך ריק', () => {
    expect(cartesianCombinations([], {})).toEqual([]);
    expect(cartesianCombinations([optionalAxis], {})).toEqual([]);
  });

  it('לא משנה את הבחירה', () => {
    const selection = { letters: ['b', 'a'], vowels: ['shva'] };
    const copy = structuredClone(selection);
    cartesianCombinations([lettersAxis, vowelsAxis], selection, noFinalWithShva);
    expect(selection).toEqual(copy);
  });
});

describe('combinationKey', () => {
  it('מזהה יציב לפי סדר הצירים', () => {
    const [combo] = cartesianCombinations([lettersAxis, vowelsAxis], { letters: ['b'], vowels: ['patah'] });
    expect(combinationKey(combo, [lettersAxis, vowelsAxis])).toBe('b|patah');
    expect(combinationKey(combo, [vowelsAxis, lettersAxis], ':')).toBe('patah:b');
  });

  it('מדלג על צירים שלא משתתפים', () => {
    const [combo] = cartesianCombinations([lettersAxis, optionalAxis], { letters: ['a'] });
    expect(combinationKey(combo, [lettersAxis, optionalAxis])).toBe('a');
  });
});

describe('generateCartesianDeck', () => {
  it('מכפלה → סינון → toItem', () => {
    const axes = [lettersAxis, vowelsAxis];
    const deck = generateCartesianDeck({
      axes,
      selection: { letters: ['a', 'final-k'], vowels: ['shva'] },
      isValidCombination: noFinalWithShva,
      toItem: (c) => ({
        id: combinationKey(c, axes),
        value: { letter: c.letters.value, vowel: c.vowels.value },
        label: `${c.letters.label}+${c.vowels.label}`,
      }),
    });
    expect(deck).toEqual([
      { id: 'a|shva', value: { letter: 'a', vowel: 'shva' }, label: 'label-a+label-shva' },
    ]);
  });
});

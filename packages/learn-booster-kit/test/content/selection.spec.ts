import { describe, it, expect } from 'vitest';
import { content } from '../src';
import { lettersAxis, optionalAxis, vowelsAxis } from './fixtures';

const {
  getAxisSelection,
  isItemSelected,
  setAxisSelection,
  toggleAxisItem,
  selectAllOnAxis,
  clearAxis,
  selectAllAxes,
  sanitizeSelection,
  validateSelection,
  parseSelection,
  axisFloor,
  toggleAxisItemWithinMinimum,
  clearAxisToMinimum,
} = content;

describe('selection — קריאה', () => {
  it('getAxisSelection מחזיר מערך ריק לציר חסר', () => {
    expect(getAxisSelection({}, 'letters')).toEqual([]);
  });

  it('isItemSelected', () => {
    const sel = { letters: ['a'] };
    expect(isItemSelected(sel, 'letters', 'a')).toBe(true);
    expect(isItemSelected(sel, 'letters', 'b')).toBe(false);
    expect(isItemSelected(sel, 'vowels', 'a')).toBe(false);
  });
});

describe('selection — עדכון immutable', () => {
  it('setAxisSelection מחליף ציר, מסיר כפילויות ולא נוגע בצירים אחרים', () => {
    const sel = { letters: ['a'], vowels: ['kamatz'] };
    const next = setAxisSelection(sel, 'letters', ['b', 'b', 'a']);
    expect(next).toEqual({ letters: ['b', 'a'], vowels: ['kamatz'] });
    expect(sel).toEqual({ letters: ['a'], vowels: ['kamatz'] });
    expect(next).not.toBe(sel);
  });

  it('toggleAxisItem בלי checked — הופך מצב', () => {
    const sel = { letters: ['a'] };
    expect(toggleAxisItem(sel, 'letters', 'b')).toEqual({ letters: ['a', 'b'] });
    expect(toggleAxisItem(sel, 'letters', 'a')).toEqual({ letters: [] });
    expect(sel).toEqual({ letters: ['a'] });
  });

  it('toggleAxisItem עם checked מפורש — אידמפוטנטי', () => {
    const sel = { letters: ['a'] };
    expect(toggleAxisItem(sel, 'letters', 'a', true)).toEqual({ letters: ['a'] });
    expect(toggleAxisItem(sel, 'letters', 'b', false)).toEqual({ letters: ['a'] });
    expect(toggleAxisItem({}, 'vowels', 'shva', true)).toEqual({ vowels: ['shva'] });
  });

  it('selectAllOnAxis בוחר את כל הפריטים הזמינים לפי סדר הציר', () => {
    expect(selectAllOnAxis({ vowels: ['shva'] }, lettersAxis)).toEqual({
      vowels: ['shva'],
      letters: ['a', 'b', 'final-k'],
    });
  });

  it('clearAxis מרוקן ציר', () => {
    expect(clearAxis({ letters: ['a'], vowels: ['shva'] }, 'letters')).toEqual({
      letters: [],
      vowels: ['shva'],
    });
  });

  it('selectAllAxes בוחר הכל בכל הצירים', () => {
    expect(selectAllAxes([lettersAxis, vowelsAxis])).toEqual({
      letters: ['a', 'b', 'final-k'],
      vowels: ['kamatz', 'patah', 'shva'],
    });
  });
});

describe('sanitizeSelection', () => {
  it('מסיר צירים ופריטים לא מוכרים ושומר על סדר הבחירה', () => {
    const sel = { letters: ['b', 'zzz', 'a', 'b'], unknownAxis: ['q'] };
    expect(sanitizeSelection([lettersAxis], sel)).toEqual({ letters: ['b', 'a'] });
  });

  it('ציר שחסר בבחירה נשאר חסר', () => {
    expect(sanitizeSelection([lettersAxis, vowelsAxis], { letters: ['a'] })).toEqual({ letters: ['a'] });
  });
});

describe('validateSelection', () => {
  it('ok כשכל הצירים עומדים במינימום — ומחזיר בחירה מנוקה', () => {
    const result = validateSelection([lettersAxis, vowelsAxis], {
      letters: ['a', 'nope'],
      vowels: ['shva'],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ letters: ['a'], vowels: ['shva'] });
  });

  it('err כשציר חובה ריק (minSelected ברירת מחדל 1)', () => {
    const result = validateSelection([lettersAxis, vowelsAxis], { letters: ['a'] });
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error).toMatchObject({
      kind: 'selection',
      reason: 'below-minimum',
      axisId: 'vowels',
      selected: 0,
      minimum: 1,
    });
    expect(error.summary).toContain('vowels');
  });

  it('פריטים לא מוכרים לא נספרים למינימום', () => {
    const result = validateSelection([lettersAxis], { letters: ['ghost'] });
    expect(result.isErr()).toBe(true);
  });

  it('allowEmpty: ריק מותר, אבל לא-ריק חייב לעמוד ב-minSelected', () => {
    expect(validateSelection([optionalAxis], {}).isOk()).toBe(true);
    expect(validateSelection([optionalAxis], { extras: [] }).isOk()).toBe(true);
    const one = validateSelection([optionalAxis], { extras: ['x'] });
    expect(one._unsafeUnwrapErr()).toMatchObject({ axisId: 'extras', selected: 1, minimum: 2 });
    expect(validateSelection([optionalAxis], { extras: ['x', 'y'] }).isOk()).toBe(true);
  });

  it('minSelected: 0 מאפשר בחירה ריקה גם בלי allowEmpty', () => {
    const axis = { ...lettersAxis, minSelected: 0 };
    expect(validateSelection([axis], {}).isOk()).toBe(true);
  });
});

describe('parseSelection (ArkType)', () => {
  it('מקבל Record<string, string[]>', () => {
    const result = parseSelection({ letters: ['a'], vowels: [] });
    expect(result._unsafeUnwrap()).toEqual({ letters: ['a'], vowels: [] });
  });

  it.each([
    ['null', null],
    ['string', 'letters'],
    ['array value of numbers', { letters: [1, 2] }],
    ['non-array value', { letters: 'a' }],
  ])('דוחה קלט לא תקין: %s', (_name, raw) => {
    const result = parseSelection(raw);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe('validation');
  });
});

describe('עריכה שמכבדת מינימום (AxisSelector enforceMinSelected)', () => {
  const minTwo = { ...lettersAxis, minSelected: 2 };

  it('axisFloor: minSelected / ברירת מחדל 1 / 0 ל-allowEmpty', () => {
    expect(axisFloor(minTwo)).toBe(2);
    expect(axisFloor(lettersAxis)).toBe(1);
    expect(axisFloor(optionalAxis)).toBe(0);
  });

  it('toggleAxisItemWithinMinimum: חוסם ירידה מתחת למינימום ומחזיר את אותו אובייקט', () => {
    const selection = { letters: ['a', 'b'] };
    expect(toggleAxisItemWithinMinimum(selection, minTwo, 'a', false)).toBe(selection);
    expect(toggleAxisItemWithinMinimum(selection, minTwo, 'final-k', true)).toEqual({
      letters: ['a', 'b', 'final-k'],
    });
    expect(
      toggleAxisItemWithinMinimum({ letters: ['a', 'b', 'final-k'] }, minTwo, 'a', false),
    ).toEqual({ letters: ['b', 'final-k'] });
  });

  it('toggleAxisItemWithinMinimum: ציר allowEmpty מתרוקן, אבל לא נשאר מתחת ל-minSelected כשאינו ריק', () => {
    expect(toggleAxisItemWithinMinimum({ extras: ['x'] }, optionalAxis, 'x', false)).toEqual({ extras: [] });
    const two = { extras: ['x', 'y'] };
    expect(toggleAxisItemWithinMinimum(two, optionalAxis, 'x', false)).toBe(two);
  });

  it('clearAxisToMinimum: משאיר את המינימום לפי סדר הציר; allowEmpty מתרוקן', () => {
    expect(clearAxisToMinimum({ letters: ['final-k'], vowels: ['shva'] }, minTwo)).toEqual({
      letters: ['a', 'b'],
      vowels: ['shva'],
    });
    expect(clearAxisToMinimum({ extras: ['x', 'y'] }, optionalAxis)).toEqual({ extras: [] });
  });
});

// @vitest-environment jsdom
/**
 * AxisSelector — mount ב-jsdom ובדיקת המבנה והאינטראקציה:
 * fieldset לכל ציר, מונה, checkbox לכל פריט, "בחר הכל" / "נקה", formatCount, disabled.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import AxisSelector from '../../src/content/AxisSelector.svelte';
import type { ProviderSelection } from '../../src/content/types';
import { lettersAxis, vowelsAxis } from './fixtures';

const labels = { selectAll: 'ALL', clearAll: 'NONE' };
let instance: ReturnType<typeof mount> | undefined;

function renderSelector(selection: ProviderSelection, extra: Record<string, unknown> = {}) {
  const onchange = vi.fn();
  const target = document.createElement('div');
  document.body.appendChild(target);
  instance = mount(AxisSelector, {
    target,
    props: { axes: [lettersAxis, vowelsAxis], selection, onchange, labels, ...extra },
  });
  flushSync();
  return { target, onchange };
}

afterEach(() => {
  if (instance) unmount(instance);
  instance = undefined;
  document.body.innerHTML = '';
});

describe('AxisSelector', () => {
  it('fieldset עם legend לכל ציר ו-checkbox לכל פריט', () => {
    const { target } = renderSelector({ letters: ['a'] });
    const fieldsets = target.querySelectorAll('fieldset');
    expect(fieldsets).toHaveLength(2);
    expect(fieldsets[0].dataset.axisId).toBe('letters');
    expect(fieldsets[0].querySelector('legend')?.textContent).toBe('Letters');
    expect(fieldsets[1].querySelector('legend')?.textContent).toBe('Vowels');
    expect(fieldsets[0].querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
    expect(fieldsets[1].querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
  });

  it('מסמן את הפריטים הנבחרים ומציג מונה (מזהה לא מוכר לא נספר)', () => {
    const { target } = renderSelector({ letters: ['a', 'final-k', 'ghost'] });
    const letters = target.querySelector('fieldset[data-axis-id="letters"]')!;
    const checked = [...letters.querySelectorAll<HTMLInputElement>('input')].map((i) => i.checked);
    expect(checked).toEqual([true, false, true]);
    expect(letters.textContent).toContain('(2/3)');
    expect(target.querySelector('fieldset[data-axis-id="vowels"]')!.textContent).toContain('(0/3)');
  });

  it('שינוי checkbox מדווח בחירה חדשה בלי לשנות את הקלט', () => {
    const selection = { letters: ['a'] };
    const { target, onchange } = renderSelector(selection);
    const b = target.querySelector<HTMLInputElement>('label[data-item-id="b"] input')!;
    b.checked = true;
    b.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onchange).toHaveBeenCalledWith({ letters: ['a', 'b'] });

    const a = target.querySelector<HTMLInputElement>('label[data-item-id="a"] input')!;
    a.checked = false;
    a.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onchange).toHaveBeenLastCalledWith({ letters: [] });
    expect(selection).toEqual({ letters: ['a'] });
  });

  it('"בחר הכל" ו-"נקה" פועלים על הציר שלהם בלבד', () => {
    const { target, onchange } = renderSelector({ letters: ['a'], vowels: ['shva'] });
    const vowels = target.querySelector('fieldset[data-axis-id="vowels"]')!;
    const [selectAll, clearAll] = [...vowels.querySelectorAll('button')];
    expect(selectAll.textContent?.trim()).toBe('ALL');
    expect(clearAll.textContent?.trim()).toBe('NONE');

    selectAll.click();
    expect(onchange).toHaveBeenLastCalledWith({ letters: ['a'], vowels: ['kamatz', 'patah', 'shva'] });
    clearAll.click();
    expect(onchange).toHaveBeenLastCalledWith({ letters: ['a'], vowels: [] });
  });

  it('formatCount מותאם', () => {
    const { target } = renderSelector({ letters: ['a'] }, { formatCount: (s: number, t: number) => `${s} of ${t}` });
    expect(target.querySelector('fieldset[data-axis-id="letters"]')!.textContent).toContain('(1 of 3)');
  });

  it('label של הפריט כשאין itemComponent', () => {
    const { target } = renderSelector({});
    expect(target.querySelector('label[data-item-id="a"]')?.textContent).toContain('label-a');
  });

  it('disabled מועבר ל-fieldset', () => {
    const { target } = renderSelector({}, { disabled: true });
    target.querySelectorAll('fieldset').forEach((f) => expect(f.disabled).toBe(true));
  });

  describe('enforceMinSelected + ברירת מחדל (additive)', () => {
    const minLetters = { ...lettersAxis, minSelected: 2 };
    function renderMin(selection: ProviderSelection, extra: Record<string, unknown> = {}) {
      const onchange = vi.fn();
      const target = document.createElement('div');
      document.body.appendChild(target);
      instance = mount(AxisSelector, {
        target,
        props: {
          axes: [minLetters],
          selection,
          onchange,
          labels: { ...labels, reset: 'DEFAULT' },
          enforceMinSelected: true,
          ...extra,
        },
      });
      flushSync();
      return { target, onchange };
    }

    it('ביטול סימון שיוריד מתחת ל-minSelected נחסם וה-checkbox חוזר למצב מסומן', () => {
      const { target, onchange } = renderMin({ letters: ['a', 'b'] });
      const a = target.querySelector<HTMLInputElement>('label[data-item-id="a"] input')!;
      a.checked = false;
      a.dispatchEvent(new Event('change', { bubbles: true }));
      expect(onchange).not.toHaveBeenCalled();
      expect(a.checked).toBe(true);
    });

    it('ביטול סימון מעל המינימום מותר', () => {
      const { target, onchange } = renderMin({ letters: ['a', 'b', 'final-k'] });
      const a = target.querySelector<HTMLInputElement>('label[data-item-id="a"] input')!;
      a.checked = false;
      a.dispatchEvent(new Event('change', { bubbles: true }));
      expect(onchange).toHaveBeenCalledWith({ letters: ['b', 'final-k'] });
    });

    it('"נקה" משאיר את המינימום לפי סדר הציר', () => {
      const { target, onchange } = renderMin({ letters: ['final-k', 'b'] });
      const [, clearAll] = [...target.querySelectorAll('button')];
      clearAll.click();
      expect(onchange).toHaveBeenLastCalledWith({ letters: ['a', 'b'] });
    });

    it('כפתור "ברירת מחדל" מוצג רק עם defaultSelection ומחזיר את בחירת ברירת המחדל לציר', () => {
      const without = renderMin({ letters: ['a', 'b'] });
      expect(without.target.querySelector('[data-action="reset"]')).toBeNull();
      unmount(instance!);
      instance = undefined;

      const { target, onchange } = renderMin(
        { letters: ['a', 'b'], other: ['x'] },
        { defaultSelection: { letters: ['b', 'final-k'] } },
      );
      const reset = target.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
      expect(reset.textContent?.trim()).toBe('DEFAULT');
      reset.click();
      expect(onchange).toHaveBeenLastCalledWith({ letters: ['b', 'final-k'], other: ['x'] });
    });
  });
});

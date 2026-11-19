/**
 * Fixtures משותפים לבדיקות ה-content: צירים ו-Providers מזויפים.
 */
import type { Component } from 'svelte';
import type {
  AnyContentProvider,
  ContentItem,
  ProviderSelection,
  SelectionAxis,
} from '../../src/content/types';

export const mockComponent = (() => {}) as unknown as Component<any>;

function items(ids: string[]): ContentItem<string>[] {
  return ids.map((id) => ({ id, value: id, label: `label-${id}` }));
}

/** ציר "אותיות" — 3 פריטים, אחד מהם סופית */
export const lettersAxis: SelectionAxis<string> = {
  id: 'letters',
  displayName: 'Letters',
  getAvailableItems: () => items(['a', 'b', 'final-k']),
};

/** ציר "תנועות" — 3 פריטים, אחד מהם "שווא" */
export const vowelsAxis: SelectionAxis<string> = {
  id: 'vowels',
  displayName: 'Vowels',
  getAvailableItems: () => items(['kamatz', 'patah', 'shva']),
};

/** ציר אופציונלי — מותר ריק, ואם לא ריק לפחות 2 */
export const optionalAxis: SelectionAxis<string> = {
  id: 'extras',
  displayName: 'Extras',
  allowEmpty: true,
  minSelected: 2,
  getAvailableItems: () => items(['x', 'y', 'z']),
};

/** חוק סינון לדוגמה: סופית לא מקבלת שווא */
export const noFinalWithShva = (c: Readonly<Record<string, string>>) =>
  !(c.letters === 'final-k' && c.vowels === 'shva');

export function makeProvider(id: string, overrides: Partial<AnyContentProvider> = {}): AnyContentProvider {
  return {
    id,
    displayName: `Provider ${id}`,
    icon: '🧪',
    selectionAxes: [lettersAxis],
    generateDeck: (selection: ProviderSelection) =>
      lettersAxis.getAvailableItems().filter((i) => selection.letters?.includes(i.id)),
    generateCardContent: (item: ContentItem) => ({ providerId: id, itemId: item.id, data: item.value }),
    contentMatches: (a, b) => a.itemId === b.itemId,
    renderComponent: mockComponent,
    getDefaultSelection: () => ({ letters: ['a', 'b', 'final-k'] }),
    ...overrides,
  };
}

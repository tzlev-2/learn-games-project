import { describe, it, expect, vi } from 'vitest';
import { content } from '../src';
import { mockComponent } from './fixtures';
import type { LegacyContentProvider } from '../../src/content/legacy-adapter';

const {
  legacyToMultiAxis,
  isLegacyContentProvider,
  legacySelectionFromSettings,
  applySelectionToLegacySettings,
  isContentProvider,
  LEGACY_AXIS_ID,
} = content;

interface ColorSettings {
  selectedColors: string[];
  shade: 'light' | 'dark';
}

function makeLegacy(): LegacyContentProvider<{ hex: string }, ColorSettings> {
  return {
    id: 'colors',
    displayName: 'Colors',
    icon: '🎨',
    getAvailableItems: () => [
      { id: 'red', value: { hex: '#f00' }, label: 'Red' },
      { id: 'green', value: { hex: '#0f0' }, label: 'Green' },
      { id: 'blue', value: { hex: '#00f' }, label: 'Blue' },
    ],
    getDefaultSettings: () => ({ selectedColors: ['red', 'blue'], shade: 'light' }),
    prepareForGame: vi.fn(),
    generateCardContent: (value, settings) => ({
      providerId: 'colors',
      itemId: value.hex,
      data: { hex: value.hex, shade: settings.shade },
    }),
    contentMatches: (a, b) => a.itemId === b.itemId,
    getSelectedItemIds: (s) => [...s.selectedColors],
    updateSelectedItems: (s, ids) => ({ ...s, selectedColors: ids }),
    renderComponent: mockComponent,
    settingsComponent: mockComponent,
    cardStyles: { contentLayout: 'vertical' },
  };
}

describe('legacyToMultiAxis', () => {
  it('מייצר Provider רב-צירי תקין עם ציר יחיד "items"', () => {
    const legacy = makeLegacy();
    const provider = legacyToMultiAxis(legacy);
    expect(isContentProvider(provider)).toBe(true);
    expect(provider.id).toBe('colors');
    expect(provider.displayName).toBe('Colors');
    expect(provider.icon).toBe('🎨');
    expect(provider.selectionAxes).toHaveLength(1);
    const [axis] = provider.selectionAxes;
    expect(axis.id).toBe(LEGACY_AXIS_ID);
    expect(axis.displayName).toBe('Colors');
    expect(axis.minSelected).toBe(1);
    expect(axis.getAvailableItems()).toEqual(legacy.getAvailableItems());
  });

  it('מעביר רכיבים ועיצוב כמו שהם', () => {
    const legacy = makeLegacy();
    const provider = legacyToMultiAxis(legacy);
    expect(provider.renderComponent).toBe(legacy.renderComponent);
    expect(provider.settingsComponent).toBe(legacy.settingsComponent);
    expect(provider.cardStyles).toEqual({ contentLayout: 'vertical' });
  });

  it('getDefaultSelection נגזר מה-settings הישנים', () => {
    expect(legacyToMultiAxis(makeLegacy()).getDefaultSelection()).toEqual({ items: ['red', 'blue'] });
  });

  it('generateDeck מחזיר פריטים נבחרים לפי סדר הזמינות', () => {
    const provider = legacyToMultiAxis(makeLegacy());
    const settings = provider.getDefaultSettings!();
    expect(provider.generateDeck({ items: ['blue', 'red', 'ghost'] }, settings).map((i) => i.id)).toEqual([
      'red',
      'blue',
    ]);
    expect(provider.generateDeck({}, settings)).toEqual([]);
  });

  it('generateCardContent מעביר ל-legacy את item.value ואת ה-settings', () => {
    const provider = legacyToMultiAxis(makeLegacy());
    const [red] = provider.generateDeck({ items: ['red'] }, provider.getDefaultSettings!());
    expect(provider.generateCardContent(red, { selectedColors: [], shade: 'dark' })).toEqual({
      providerId: 'colors',
      itemId: '#f00',
      data: { hex: '#f00', shade: 'dark' },
    });
  });

  it('contentMatches ו-prepareForGame מואצלים', () => {
    const legacy = makeLegacy();
    const provider = legacyToMultiAxis(legacy);
    const a = { providerId: 'colors', itemId: 'x', data: null };
    expect(provider.contentMatches(a, { ...a })).toBe(true);
    expect(provider.contentMatches(a, { ...a, itemId: 'y' })).toBe(false);
    provider.prepareForGame?.();
    expect(legacy.prepareForGame).toHaveBeenCalledOnce();
  });

  it('prepareForGame חסר ב-legacy → חסר ב-adapter', () => {
    const legacy = { ...makeLegacy(), prepareForGame: undefined };
    expect(legacyToMultiAxis(legacy).prepareForGame).toBeUndefined();
  });

  it('axisId / axisDisplayName מותאמים', () => {
    const provider = legacyToMultiAxis(makeLegacy(), { axisId: 'colors', axisDisplayName: 'Pick colors' });
    expect(provider.selectionAxes[0]).toMatchObject({ id: 'colors', displayName: 'Pick colors' });
    expect(provider.getDefaultSelection()).toEqual({ colors: ['red', 'blue'] });
    expect(provider.generateDeck({ colors: ['green'] }, provider.getDefaultSettings!())).toHaveLength(1);
  });
});

describe('המרת בחירה הלוך-חזור', () => {
  it('legacySelectionFromSettings', () => {
    const legacy = makeLegacy();
    expect(legacySelectionFromSettings(legacy, { selectedColors: ['green'], shade: 'dark' })).toEqual({
      items: ['green'],
    });
    expect(legacySelectionFromSettings(legacy, { selectedColors: [], shade: 'dark' }, 'c')).toEqual({ c: [] });
  });

  it('applySelectionToLegacySettings לא משנה את המקור ושומר שדות אחרים', () => {
    const legacy = makeLegacy();
    const settings: ColorSettings = { selectedColors: ['red'], shade: 'dark' };
    const next = applySelectionToLegacySettings(legacy, settings, { items: ['blue', 'green'] });
    expect(next).toEqual({ selectedColors: ['blue', 'green'], shade: 'dark' });
    expect(settings).toEqual({ selectedColors: ['red'], shade: 'dark' });
    expect(applySelectionToLegacySettings(legacy, settings, {})).toEqual({ selectedColors: [], shade: 'dark' });
  });
});

describe('isLegacyContentProvider', () => {
  it('true ל-Provider ישן, false ל-Provider רב-צירי', () => {
    const legacy = makeLegacy();
    expect(isLegacyContentProvider(legacy)).toBe(true);
    expect(isLegacyContentProvider(legacyToMultiAxis(legacy))).toBe(false);
  });

  it.each([null, undefined, 'string', 123, true])('false לערך לא-אובייקט: %s', (value) => {
    expect(isLegacyContentProvider(value)).toBe(false);
  });

  it.each([
    'id',
    'displayName',
    'icon',
    'getAvailableItems',
    'getDefaultSettings',
    'generateCardContent',
    'contentMatches',
    'getSelectedItemIds',
    'updateSelectedItems',
    'renderComponent',
  ])('false כשחסר %s', (field) => {
    const provider = { ...makeLegacy() } as Record<string, unknown>;
    delete provider[field];
    expect(isLegacyContentProvider(provider)).toBe(false);
  });
});

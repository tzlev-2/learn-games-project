import { describe, it, expect, beforeEach } from 'vitest';
import { content } from '../src';
import { makeProvider } from './fixtures';

const { createContentRegistry, resolveGameContent, isContentProvider } = content;
type ContentRegistry = ReturnType<typeof createContentRegistry>;

describe('createContentRegistry', () => {
  let registry: ContentRegistry;
  const providerA = makeProvider('a');
  const providerB = makeProvider('b');

  beforeEach(() => {
    registry = createContentRegistry();
  });

  it('רישום ושליפה', () => {
    registry.register(providerA);
    expect(registry.has('a')).toBe(true);
    expect(registry.getOrThrow('a')).toBe(providerA);
    expect(registry.get('a')._unsafeUnwrap()).toBe(providerA);
  });

  it('רישום מעל id קיים דורס (HMR)', () => {
    registry.register(providerA);
    const updated = makeProvider('a', { displayName: 'updated' });
    registry.register(updated);
    expect(registry.getOrThrow('a').displayName).toBe('updated');
    expect(registry.getAll()).toHaveLength(1);
  });

  it('get של id חסר → err provider-not-found', () => {
    const result = registry.get('missing');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: 'provider-not-found', providerId: 'missing' });
  });

  it('getOrThrow של id חסר זורק (programmer error)', () => {
    expect(() => registry.getOrThrow('missing')).toThrow('Provider with id "missing" not found');
  });

  it('getAll / ids לפי סדר הרישום, ריק בהתחלה', () => {
    expect(registry.getAll()).toEqual([]);
    registry.register(providerB);
    registry.register(providerA);
    expect(registry.ids()).toEqual(['b', 'a']);
    expect(registry.getAll()).toEqual([providerB, providerA]);
  });

  it('unregister', () => {
    registry.register(providerA);
    expect(registry.unregister('a')).toBe(true);
    expect(registry.has('a')).toBe(false);
    expect(registry.unregister('a')).toBe(false);
  });

  it('clear', () => {
    registry.register(providerA);
    registry.register(providerB);
    registry.clear();
    expect(registry.getAll()).toEqual([]);
  });

  it('אתחול עם Providers ראשוניים', () => {
    const r = createContentRegistry([providerA, providerB]);
    expect(r.ids()).toEqual(['a', 'b']);
  });

  it('instances נפרדים לא משתפים מצב', () => {
    const r1 = createContentRegistry([providerA]);
    const r2 = createContentRegistry();
    expect(r2.has('a')).toBe(false);
    expect(r1.has('a')).toBe(true);
  });
});

describe('resolveGameContent', () => {
  const registry = createContentRegistry([makeProvider('letters'), makeProvider('shapes'), makeProvider('other')]);

  it('מחזיר את ה-Providers לפי סדר ההצהרה ואת ברירת המחדל', () => {
    const game = resolveGameContent(registry, {
      gameId: 'demo',
      providerIds: ['shapes', 'letters'],
      defaultProviderId: 'letters',
    })._unsafeUnwrap();
    expect(game.gameId).toBe('demo');
    expect(game.providers.map((p) => p.id)).toEqual(['shapes', 'letters']);
    expect(game.defaultProvider.id).toBe('letters');
    expect(game.supports('shapes')).toBe(true);
    expect(game.supports('other')).toBe(false);
  });

  it('resolveProviderId / getProvider נופלים לברירת המחדל עבור id לא נתמך', () => {
    const game = resolveGameContent(registry, {
      gameId: 'demo',
      providerIds: ['letters', 'shapes'],
      defaultProviderId: 'letters',
    })._unsafeUnwrap();
    expect(game.resolveProviderId('shapes')).toBe('shapes');
    expect(game.resolveProviderId('other')).toBe('letters'); // רשום, אבל המשחק לא צורך
    expect(game.resolveProviderId(undefined)).toBe('letters');
    expect(game.resolveProviderId(42)).toBe('letters');
    expect(game.getProvider('shapes').id).toBe('shapes');
    expect(game.getProvider('nope').id).toBe('letters');
  });

  it('err כש-Provider מוצהר לא רשום', () => {
    const result = resolveGameContent(registry, {
      gameId: 'demo',
      providerIds: ['letters', 'missing'],
      defaultProviderId: 'letters',
    });
    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: 'provider-not-found', providerId: 'missing' });
  });

  it('err כשברירת המחדל לא ברשימה', () => {
    const result = resolveGameContent(registry, {
      gameId: 'demo',
      providerIds: ['letters'],
      defaultProviderId: 'shapes',
    });
    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: 'invalid-declaration', providerId: 'shapes' });
  });

  it('err כשההצהרה ריקה', () => {
    const result = resolveGameContent(registry, { gameId: 'demo', providerIds: [], defaultProviderId: 'x' });
    expect(result._unsafeUnwrapErr().kind).toBe('invalid-declaration');
  });
});

describe('isContentProvider', () => {
  it('true ל-Provider תקין', () => {
    expect(isContentProvider(makeProvider('ok'))).toBe(true);
  });

  it.each([null, undefined, 'string', 123, true])('false לערך לא-אובייקט: %s', (value) => {
    expect(isContentProvider(value)).toBe(false);
  });

  it.each(['id', 'selectionAxes', 'generateDeck', 'generateCardContent', 'contentMatches', 'getDefaultSelection', 'renderComponent'])(
    'false כשחסר %s',
    (field) => {
      const provider = { ...makeProvider('x') } as Record<string, unknown>;
      delete provider[field];
      expect(isContentProvider(provider)).toBe(false);
    },
  );

  it('false כש-selectionAxes אינו מערך', () => {
    expect(isContentProvider({ ...makeProvider('x'), selectionAxes: {} })).toBe(false);
  });
});

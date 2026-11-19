/**
 * Content registry — רישום Providers והצהרת המשחק אילו Providers הוא צורך.
 *
 * החלטה (platform-plan §6.4): ה-registry יושב בקיט כ-factory, וכל משחק
 * יוצר instance משלו (כל משחק הוא deploy נפרד — singleton גלובלי לא היה
 * מוסיף כלום). Provider שמשותף לכמה משחקים יהיה אובייקט מיוצא (בקיט או
 * ב-package תוכן), וכל משחק רושם אותו ומצהיר עליו ב-`GameContentDeclaration`.
 */
import { err, ok, type Result } from "../lib/result";
import type { AnyContentProvider } from "./types";

export interface ContentRegistryError {
  kind: "provider-not-found" | "invalid-declaration";
  /** ה-Provider שחסר / שגרם לשגיאה (אם רלוונטי) */
  providerId?: string;
  summary: string;
}

export interface ContentRegistry {
  /** רישום Provider. id קיים נדרס (תמיכה ב-HMR). */
  register(provider: AnyContentProvider): void;
  /** שליפה בטוחה — לקלט חיצוני (id שנקרא מאחסון) */
  get(id: string): Result<AnyContentProvider, ContentRegistryError>;
  /** שליפה למזהה שידוע שקיים. Provider חסר = programmer error → זורק. */
  getOrThrow(id: string): AnyContentProvider;
  has(id: string): boolean;
  /** כל ה-Providers לפי סדר הרישום */
  getAll(): AnyContentProvider[];
  ids(): string[];
  unregister(id: string): boolean;
  clear(): void;
}

function notFound(id: string): ContentRegistryError {
  return { kind: "provider-not-found", providerId: id, summary: `Provider with id "${id}" not found` };
}

/** יצירת registry חדש, אופציונלית עם Providers ראשוניים */
export function createContentRegistry(initial: readonly AnyContentProvider[] = []): ContentRegistry {
  const providers = new Map<string, AnyContentProvider>();
  for (const provider of initial) providers.set(provider.id, provider);

  return {
    register(provider) {
      providers.set(provider.id, provider);
    },
    get(id) {
      const provider = providers.get(id);
      return provider ? ok(provider) : err(notFound(id));
    },
    getOrThrow(id) {
      const provider = providers.get(id);
      if (!provider) throw new Error(notFound(id).summary);
      return provider;
    },
    has: (id) => providers.has(id),
    getAll: () => Array.from(providers.values()),
    ids: () => Array.from(providers.keys()),
    unregister: (id) => providers.delete(id),
    clear: () => providers.clear(),
  };
}

// ─── הצהרת משחק ─────────────────────────────────────────────────────────────

/** הצהרת משחק: אילו Providers הוא מסוגל לצרוך, ומי ברירת המחדל */
export interface GameContentDeclaration {
  gameId: string;
  /** סדר ההצגה במסך ההגדרות */
  providerIds: readonly string[];
  defaultProviderId: string;
}

/** התוכן של משחק אחרי resolve מול registry */
export interface GameContent {
  gameId: string;
  providers: AnyContentProvider[];
  defaultProvider: AnyContentProvider;
  /** האם המשחק צורך את ה-Provider */
  supports(providerId: string): boolean;
  /** id שמור (אולי לא מוכר/לא string) → id נתמך, או ברירת המחדל */
  resolveProviderId(providerId: unknown): string;
  /** ה-Provider לפי id; id לא נתמך → ברירת המחדל */
  getProvider(providerId: unknown): AnyContentProvider;
}

/**
 * פתרון הצהרת משחק מול registry.
 * נכשל אם ההצהרה ריקה, אם ברירת המחדל לא ברשימה, או אם Provider לא רשום.
 */
export function resolveGameContent(
  registry: ContentRegistry,
  declaration: GameContentDeclaration,
): Result<GameContent, ContentRegistryError> {
  const { gameId, providerIds, defaultProviderId } = declaration;

  if (providerIds.length === 0) {
    return err({ kind: "invalid-declaration", summary: `Game "${gameId}" declares no providers` });
  }
  if (!providerIds.includes(defaultProviderId)) {
    return err({
      kind: "invalid-declaration",
      providerId: defaultProviderId,
      summary: `Game "${gameId}": default provider "${defaultProviderId}" is not in providerIds`,
    });
  }

  const providers: AnyContentProvider[] = [];
  for (const id of providerIds) {
    const result = registry.get(id);
    if (result.isErr()) return err(result.error);
    providers.push(result.value);
  }

  const byId = new Map(providers.map((p) => [p.id, p]));
  const defaultProvider = byId.get(defaultProviderId)!;

  const resolveProviderId = (providerId: unknown): string =>
    typeof providerId === "string" && byId.has(providerId) ? providerId : defaultProviderId;

  return ok({
    gameId,
    providers,
    defaultProvider,
    supports: (providerId) => byId.has(providerId),
    resolveProviderId,
    getProvider: (providerId) => byId.get(resolveProviderId(providerId))!,
  });
}

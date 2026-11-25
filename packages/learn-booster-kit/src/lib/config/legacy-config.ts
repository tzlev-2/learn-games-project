import { type } from 'arktype';
import { BoosterConfigSchema, BOOSTER_CONFIG_SCHEMA_REGISTRY, type BoosterConfig } from '../../schemas';

/** מעבר gingim הקיים: קריאה, כתיבה ליעד ורק אז מחיקת המקור. */
export function migrateLegacyBoosterStorage(): void {
  try {
    const old = localStorage.getItem('gingim-booster-config');
    if (old) {
      if (!localStorage.getItem('learn-booster-config')) localStorage.setItem('learn-booster-config', old);
      localStorage.removeItem('gingim-booster-config');
    }
  } catch { /* שגיאת אחסון משאירה את המקור לניסיון הבא. */ }
}

/** מפתח המראה נקרא רק כזרע בהיעדר state פרופילים. */
export function readLegacyBoosterConfig(defaults: BoosterConfig): {
  config: BoosterConfig; invalidRaw?: string;
} {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem('learn-booster-config');
    if (raw === null) return { config: defaults };
    const parsed: unknown = JSON.parse(raw);
    const versioned = type({ 'schemaVersion?': 'number' })(parsed);
    if (versioned instanceof type.errors) throw new Error(versioned.summary);
    const version = versioned.schemaVersion ?? 1;
    const schema = BOOSTER_CONFIG_SCHEMA_REGISTRY[version as keyof typeof BOOSTER_CONFIG_SCHEMA_REGISTRY];
    if (!schema) throw new Error(`Unknown booster config version: ${version}`);
    const partial = schema.partial()(parsed);
    if (partial instanceof type.errors) throw new Error(partial.summary);
    const config = BoosterConfigSchema(mergeLegacy(structuredClone(defaults), partial));
    if (config instanceof type.errors) throw new Error(config.summary);
    return { config };
  } catch (error) {
    console.warn('Failed to read legacy booster config:', error);
    return raw === null ? { config: defaults } : { config: defaults, invalidRaw: raw };
  }
}

function mergeLegacy<T extends object>(target: T, patch: Partial<T>): T {
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const item = patch[key];
    if (item && typeof item === 'object' && !Array.isArray(item)
      && target[key] && typeof target[key] === 'object') {
      target[key] = mergeLegacy(target[key] as object, item) as T[keyof T];
    } else target[key] = item as T[keyof T];
  }
  return target;
}

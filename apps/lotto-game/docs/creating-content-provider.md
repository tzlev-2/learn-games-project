# מדריך: הוספת ספק תוכן (Content Provider) ללוטו

> מאז 2026-11-19 הלוטו רץ על ה-**ContentProvider הרב-צירי של הקיט** (`learn-booster-kit`, מודול `src/content/`).
> החוזה המלא, ה-API וההחלטות: **[`packages/learn-booster-kit/docs/content-provider.md`](../../../packages/learn-booster-kit/docs/content-provider.md)**.
> המסמך הזה מכסה רק את מה שספציפי ללוטו. הגרסה הקודמת (חוזה ציר-יחיד עם `getSelectedItemIds`) נמצאת בהיסטוריית git.

## 1. איך התוכן מחובר בלוטו

```
src/lib/
├── language.ts                    ← שמות Providers/צירים, labels של AxisSelector
├── content/
│   ├── types.ts                   ← re-export של טיפוסי הקיט
│   ├── registry.ts                ← contentRegistry = createContentRegistry()
│   ├── game-content.ts            ← LOTTO_CONTENT_DECLARATION + lottoContent (resolveGameContent)
│   ├── index.ts
│   └── providers/
│       ├── index.ts               ← רישום כל ה-Providers ב-registry
│       ├── letters/               ← ציר 'letters'
│       ├── shapes/                ← ציר 'shapes' + settingsComponent (מצב צבעים) + ShapeAxisItem
│       └── reading/               ← ציר 'readingItems' + ReadingAxisItem
├── stores/
│   ├── settings-schema.ts         ← צורת ההגדרות v3 + מיגרציות (registerGameSchema)
│   └── settings.svelte.ts         ← ה-store (contentSelections / contentSettings לכל provider)
└── utils/gameLogic.ts             ← generateCards: generateDeck → בחירת זוגות → generateCardContent
```

- **מסך ההגדרות** (`routes/settings/_components/SettingsControls.svelte`): בורר Provider מתוך `lottoContent.providers`, ואז `AxisSelector` של הקיט על `provider.selectionAxes`, ואחריו `provider.settingsComponent` (אם יש).
- **משחק** (`routes/+page.svelte`): `settings.getCurrentSelection()` + `settings.getCurrentProviderSettings()` → `generateCards`.
- **כרטיס** (`ContentRenderer.svelte`, `Card.svelte`): `contentRegistry.getOrThrow(content.providerId)` → `renderComponent`, `cardStyles`.

### צורת ההגדרות השמורה (`lotto-game-settings`, v3)

```jsonc
{
  "schemaVersion": 3,
  "contentProviderId": "shapes",
  "contentSelections": {               // providerId → ProviderSelection
    "letters": { "letters": ["א", "ב"] },
    "shapes":  { "shapes": ["circle", "star"] }
  },
  "contentSettings": {                 // providerId → הגדרות שאינן בחירה
    "shapes": { "colorMode": "uniform" }
  },
  "gameMode": "lotto", "pairCount": 10, "...": "..."
}
```

אין בחירה שמורה ל-Provider → `provider.getDefaultSelection()`. הגדרות v1/v2 עוברות מיגרציה אוטומטית בטעינה (ראה `settings-schema.ts`).

## 2. הוספת Provider חדש — צעדים

נניח Provider של מספרים 1–10.

### שלב 1: מחרוזות ב-`src/lib/language.ts`

```ts
providers: { ..., numbers: 'מספרים' },
axes: { ..., numbers: 'בחירת מספרים' },
```

### שלב 2: `providers/numbers/index.ts`

```ts
import { selectAxisItems } from 'learn-booster-kit';
import type { CardContent, ContentItem, ContentProvider, SelectionAxis } from '../../types';
import { language } from '$lib/language';
import NumberContent from './NumberContent.svelte';

const NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

export type NumbersProviderSettings = Record<string, never>;

export const numbersAxis: SelectionAxis<number> = {
	id: 'numbers',
	displayName: language.content.axes.numbers,
	getAvailableItems: (): ContentItem<number>[] =>
		NUMBERS.map((n) => ({ id: String(n), value: n, label: String(n) }))
};

export const numbersProvider: ContentProvider<NumbersProviderSettings, number> = {
	id: 'numbers',
	displayName: language.content.providers.numbers,
	icon: '🔢',
	selectionAxes: [numbersAxis],
	generateDeck: (selection) => selectAxisItems(numbersAxis, selection),
	getDefaultSelection: () => ({ numbers: NUMBERS.map(String) }),
	getDefaultSettings: () => ({}),
	generateCardContent: (item): CardContent => ({ providerId: 'numbers', itemId: item.id, data: item.value }),
	contentMatches: (a, b) => a.itemId === b.itemId,
	renderComponent: NumberContent
};
```

### שלב 3: קומפוננטת תצוגה (`NumberContent.svelte`)

מקבלת `{ content }: CardContentProps` ומציגה את `content.data`. דוגמה: `providers/letters/LetterContent.svelte` (גודל פונט ב-container query, `font-size: 60cqw`).

### שלב 4 (אופציונלי): תצוגת פריט במסך הבחירה

אם `item.label` לא מספיק (תמונה, SVG) — `itemComponent` על הציר, עם `{ item, selected }: AxisItemProps<T>`. דוגמאות: `shapes/ShapeAxisItem.svelte` (‏SVG ב-`currentColor` כדי לרשת את צבע האריח), `reading/ReadingAxisItem.svelte`.

### שלב 5 (אופציונלי): הגדרות שאינן בחירה

`settingsComponent` עם `{ settings, onSettingsUpdate }: ProviderSettingsProps<TSettings>`, ו-`getDefaultSettings()` שמחזיר את ברירות המחדל. דוגמה: `shapes/ShapesSettings.svelte` (מצב צבעים). **לא** לשים את הבחירה ב-settings.

### שלב 6: רישום והצהרה

```ts
// providers/index.ts
contentRegistry.register(numbersProvider);

// game-content.ts
providerIds: ['letters', 'shapes', 'reading', 'numbers'],
```

`resolveGameContent` נכשל בטעינה אם Provider מוצהר ולא רשום — טעות כזו נתפסת מיד (וגם ב-`game-content.spec.ts`).

### שלב 7: בדיקות

`providers/numbers/index.spec.ts` לפי התבנית של `letters/index.spec.ts`: metadata + `isContentProvider`, הציר והפריטים, `getDefaultSelection` (+ `validateSelection`), `generateDeck` (סדר, ריק, מזהים לא מוכרים, immutability), `generateCardContent`, `contentMatches`, ותהליך מלא. עדכן את `game-content.spec.ts`.

## 3. Provider רב-צירי בלוטו

החוזה תומך בכמה צירים (`cartesianCombinations` / `generateCartesianDeck` בקיט), וה-`AxisSelector` מציג fieldset לכל ציר בלי שינוי בלוטו. ה-`ContentItem.id` של צירוף צריך להיות יציב (`combinationKey`). דוגמה: `packages/learn-booster-kit/docs/content-provider.md` §3.2.

## 4. שינוי צורת הבחירה של Provider קיים

`ContentItem.id` ו-`axis.id` נשמרים בהגדרות המורה. שינוי שלהם = מיגרציה: העלאת `LOTTO_SETTINGS_VERSION` ב-`settings-schema.ts`, צעד חדש ב-`migrateLottoSettings`, ובדיקה ב-`settings-schema.spec.ts`.

# ContentProvider רב-צירי — מדריך לכתיבה ולצריכה

> מודול: `packages/learn-booster-kit/src/content/` · ייצוא: `learn-booster-kit` (additive).
> רקע ותכנון: `docs/platform-plan.md` §5 (multi-axis), §6.4 (registry); `apps/find-letter-game/docs/plans/providerization-plan.md` §2.1, §6.
> צרכן ראשון: `apps/lotto-game` (שלב 2 בתכנית הפלטפורמה).

## 1. הרעיון בשתי שורות

**ה-Provider מספק תוכן; המשחק מספק חוויה.** המורה בוחר פריטים מ-**צירי בחירה** (`SelectionAxis`) — ציר אחד (אותיות) או כמה (אותיות × ניקוד). הבחירה נשמרת כ-`ProviderSelection` (`axisId → itemIds`), וה-Provider מייצר ממנה deck של `ContentItem` שהמשחק מציג.

```
ProviderSelection ──generateDeck──▶ ContentItem[] ──generateCardContent──▶ CardContent ──renderComponent──▶ כרטיס
      ▲
 AxisSelector (מסך המורה)
```

## 2. ה-API

### 2.1 טיפוסים (`src/content/types.ts`)

| טיפוס | תפקיד |
|-------|--------|
| `ContentItem<T>` | `{ id, value: T, label }` — פריט; `id` יציב ונשמר בהגדרות |
| `CardContent` | `{ providerId, itemId, data }` — מה שהכרטיס מציג |
| `SelectionAxis<T>` | `{ id, displayName, icon?, getAvailableItems(), allowEmpty?, minSelected?, itemComponent? }` |
| `ProviderSelection` | `Record<string, string[]>` — axisId → itemIds |
| `ContentProvider<TSettings, TItem>` | ה-Provider (ראה להלן) |
| `AnyContentProvider` / `AnySelectionAxis` | לרשימות הטרוגניות (registry, AxisSelector) |
| `CardContentProps`, `AxisItemProps<T>`, `ProviderSettingsProps<TSettings>` | ה-props של שלוש הקומפוננטות של Provider |
| `AxisSelectorLabels` | `{ selectAll, clearAll }` — מחרוזות מהצרכן |

```ts
interface ContentProvider<TSettings = unknown, TItem = unknown> {
  id: string; displayName: string; icon: string;
  selectionAxes: readonly AnySelectionAxis[];
  generateDeck(selection: ProviderSelection, settings: TSettings): ContentItem<TItem>[];
  isValidCombination?(combination: Readonly<Record<string, string>>): boolean;
  generateCardContent(item: ContentItem<TItem>, settings: TSettings): CardContent;
  contentMatches(a: CardContent, b: CardContent): boolean;
  renderComponent: Component<CardContentProps>;
  settingsComponent?: Component<ProviderSettingsProps<TSettings>>; // הגדרות שאינן בחירה
  getDefaultSelection(): ProviderSelection;
  getDefaultSettings?(): TSettings;
  prepareForGame?(): void | Promise<void>;
  cardStyles?: CardStyleOptions;
  getSpeakText?(item: ContentItem<TItem>): string | null;      // למשחקים שמקריאים
  areItemsSimilar?(a: ContentItem<TItem>, b: ContentItem<TItem>): boolean; // מסיחים
}
```

הבדלים מהחוזה הישן של הלוטו:
- **הבחירה יצאה מה-settings.** אין `getSelectedItemIds` / `updateSelectedItems`; ה-settings מכילים רק מה שאינו בחירה (למשל `colorMode`).
- `generateCardContent` מקבל **`ContentItem`** (לא את `item.value`).
- `getAvailableItems` עבר לציר: `provider.selectionAxes[i].getAvailableItems()`.
- `settingsComponent` מקבל `{ settings, onSettingsUpdate(partial) }` בלבד; בחירת הפריטים מוצגת ע"י `AxisSelector`.
- `itemComponent` (אופציונלי, על הציר) — תצוגה עשירה לפריט במסך הבחירה (תמונה, SVG). בלעדיו מוצג `item.label`.

### 2.2 בחירה — פונקציות טהורות (`selection.ts`)

| פונקציה | חתימה |
|---------|--------|
| `getAxisSelection` | `(selection, axisId) → readonly string[]` |
| `isItemSelected` | `(selection, axisId, itemId) → boolean` |
| `setAxisSelection` | `(selection, axisId, ids) → ProviderSelection` (בלי כפילויות) |
| `toggleAxisItem` | `(selection, axisId, itemId, checked?) → ProviderSelection` |
| `selectAllOnAxis` / `clearAxis` | `(selection, axis \| axisId) → ProviderSelection` |
| `selectAllAxes` | `(axes) → ProviderSelection` |
| `sanitizeSelection` | `(axes, selection) → ProviderSelection` — רק צירים/פריטים מוכרים |
| `validateSelection` | `(axes, selection) → Result<ProviderSelection, SelectionError>` — `minSelected` / `allowEmpty` |
| `parseSelection` | `(raw: unknown) → Result<ProviderSelection, ValidationError>` — ArkType (`ProviderSelectionSchema`) |

כולן מחזירות אובייקט חדש ולא משנות את הקלט.

**סמנטיקה של `allowEmpty` / `minSelected`:** ציר ריק מותר רק עם `allowEmpty`; ציר לא-ריק חייב לפחות `minSelected` (ברירת מחדל 1). `minSelected: 0` מאפשר ריק גם בלי `allowEmpty`.

### 2.3 Deck (`deck.ts`)

| פונקציה | תפקיד |
|---------|--------|
| `selectAxisItems(axis, selection)` | הפריטים הנבחרים בציר, **לפי סדר הציר**; מזהים לא מוכרים נזרקים. ה-`generateDeck` של Provider ציר-יחיד הוא שורה אחת. |
| `cartesianCombinations(axes, selection, isValid?)` | מכפלה קרטזית; הציר הראשון חיצוני. ציר ריק עם `allowEmpty` לא משתתף; ציר חובה ריק → `[]`. |
| `generateCartesianDeck({ axes, selection, isValidCombination?, toItem })` | מכפלה → סינון → `toItem` |
| `combinationIds(combo)` / `combinationKey(combo, axes, sep?)` | המרה ל-ids / מזהה יציב (`"ב\|kamatz"`) |

### 2.4 Registry (`registry.ts`)

| API | תפקיד |
|-----|--------|
| `createContentRegistry(initial?)` | `{ register, get → Result, getOrThrow, has, getAll, ids, unregister, clear }` |
| `resolveGameContent(registry, declaration)` | `Result<GameContent, ContentRegistryError>` |
| `GameContentDeclaration` | `{ gameId, providerIds, defaultProviderId }` |
| `GameContent` | `{ gameId, providers, defaultProvider, supports(id), resolveProviderId(unknown), getProvider(unknown) }` |

`get` מחזיר `Result` — לקלט חיצוני (id שנקרא מאחסון). `getOrThrow` — כשה-id ודאי קיים (Provider חסר = programmer error).

### 2.5 Adapter ל-Providers ישנים (`legacy-adapter.ts`)

`legacyToMultiAxis(legacy, { axisId?, axisDisplayName? })` עוטף Provider בחוזה הישן (`LegacyContentProvider`) כ-Provider רב-צירי עם ציר יחיד (ברירת מחדל `items`). `legacySelectionFromSettings` / `applySelectionToLegacySettings` ממירים בחירה הלוך-חזור למשחק שעדיין שומר את הצורה הישנה. `isLegacyContentProvider` — type guard.

הלוטו **לא** משתמש ב-adapter: שלושת ה-Providers שלו הומרו ל-Providers טבעיים (ציר יחיד), כי כך הבחירה נשמרת בצורה האחידה (`ProviderSelection`) שמשחקים אחרים יצרכו.

### 2.6 UI — `AxisSelector`

```svelte
<AxisSelector
  axes={provider.selectionAxes}
  selection={currentSelection}
  onchange={(next) => settings.updateSelection(next)}
  labels={language.content.selector}      // { selectAll, clearAll } — מהמשחק
  formatCount={(s, t) => `${s}/${t}`}      // אופציונלי
  itemMinWidth="4rem"                       // אופציונלי
/>
```

fieldset לכל ציר (legend = `axis.displayName`), מונה, "בחר הכל" / "נקה" לכל ציר, checkbox לכל פריט (מוסתר ויזואלית, האריח הוא ה-label). קומפוננטה controlled — לא שומרת state. העיצוב משתמש ב-design tokens של הקיט (`bg-brand-primary`, `bg-surface-sunken`...), כך שהוא מכבד theme. הקומפוננטה יושבת ב-`src/content/` (לא ב-`src/ui/`).

## 3. כתיבת Provider

### 3.1 ציר יחיד (כמו הלוטו)

```ts
import { selectAxisItems, type ContentProvider, type SelectionAxis } from 'learn-booster-kit';
import { language } from '$lib/language';

export const lettersAxis: SelectionAxis<string> = {
  id: 'letters',
  displayName: language.content.axes.letters,
  getAvailableItems: () => LETTERS.map((l) => ({ id: l, value: l, label: l })),
};

export const lettersProvider: ContentProvider<Record<string, never>, string> = {
  id: 'letters',
  displayName: language.content.providers.letters,
  icon: '🔤',
  selectionAxes: [lettersAxis],
  generateDeck: (selection) => selectAxisItems(lettersAxis, selection),
  getDefaultSelection: () => ({ letters: [...LETTERS] }),
  generateCardContent: (item) => ({ providerId: 'letters', itemId: item.id, data: item.value }),
  contentMatches: (a, b) => a.itemId === b.itemId,
  renderComponent: LetterContent,
};
```

### 3.2 כמה צירים (התכנון ל-find-letter, שלב 3)

```ts
const axes = [lettersAxis, vowelsAxis];
const isValid = ({ letters, vowels }: Readonly<Record<string, string>>) =>
  !(FINALS.has(letters) && vowels === 'shva');

export const hebrewLettersProvider: ContentProvider<Settings, LetterWithVowel> = {
  // ...
  selectionAxes: axes,
  isValidCombination: isValid,
  generateDeck(selection) {
    return generateCartesianDeck({
      axes,
      selection,
      isValidCombination: isValid,
      toItem: (c) => ({
        id: combinationKey(c, axes),
        value: { letter: c.letters.value, vowel: c.vowels.value },
        label: `${c.letters.label}${c.vowels.label}`,
      }),
    });
  },
  getDefaultSelection: () => selectAllAxes(axes),
};
```

### 3.3 כללים

- **בלי עברית בקיט.** `displayName` של Provider/ציר ו-labels של `AxisSelector` מגיעים מ-`language.ts` של המשחק (או של package התוכן).
- **`generateDeck` טהור** (תלוי רק ב-selection/settings). רנדומליות שייכת ל-`generateCardContent`/`prepareForGame` או למשחק (ערבוב).
- **`ContentItem.id` יציב** — הוא נשמר בהגדרות המורה. שינוי id = מיגרציה.
- **הבחירה לא נכנסת ל-settings.** settings = רק מה שה-`settingsComponent` עורך.

## 4. צריכת Providers במשחק

1. **Registry + הצהרה** — instance משלו והצהרה אילו Providers המשחק צורך:

   ```ts
   export const contentRegistry = createContentRegistry();
   contentRegistry.register(lettersProvider); // ...
   export const gameContent = resolveGameContent(contentRegistry, {
     gameId: 'lotto-game',
     providerIds: ['letters', 'shapes', 'reading'],
     defaultProviderId: 'letters',
   }).match((c) => c, (e) => { throw new Error(e.summary); }); // הצהרה שגויה = programmer error
   ```

2. **שמירה** — `contentProviderId` + בחירה **לכל Provider** (`Record<providerId, ProviderSelection>`) + הגדרות לכל Provider. בטעינה: `gameContent.resolveProviderId(saved)` ו-`parseSelection` לכל בחירה; אין בחירה שמורה → `provider.getDefaultSelection()`.
3. **מסך מורה** — `AxisSelector` על `provider.selectionAxes` + `provider.settingsComponent` (אם יש).
4. **משחק** — `provider.prepareForGame?.()`, `provider.generateDeck(selection, settings)`, ואז `generateCardContent` לכל פריט; התאמה עם `contentMatches`. כרטיס מוצג דרך `registry.getOrThrow(content.providerId).renderComponent`.
5. **מיגרציה** — אם צורת ההגדרות השמורה משתנה, רושמים `registerGameSchema(gameId, { currentVersion, migrate })` ומריצים `runGameSettingsMigrations(gameId, { schemaVersion, data })` בטעינה (דוגמה: `apps/lotto-game/src/lib/stores/settings-schema.ts`).

## 5. החלטת ה-registry (platform-plan §6.4)

- **ה-registry בקיט, כ-factory — לא singleton גלובלי.** כל משחק הוא deploy נפרד, אז singleton בקיט לא היה משותף בין משחקים בכל מקרה; factory נותן בידוד בבדיקות ושליטה בסדר.
- **משחק מצהיר מה הוא צורך** (`GameContentDeclaration`), וה-`resolveGameContent` מאמת שההצהרה עקבית. ההצהרה היא גם הבסיס לכלי עתידי "איזה תוכן רץ על איזה משחק" (שלב 4).
- **Provider משותף** בין משחקים יהיה אובייקט מיוצא (בקיט או ב-package תוכן נפרד) — כל משחק רושם אותו ומצהיר עליו.
- **תוכן חיצוני (JSON/YAML)** — לא הוחלט; החוזה מאפשר זאת (Provider יכול לבנות צירים מנתונים), אבל אין loader כרגע.

## 6. בדיקות

`packages/learn-booster-kit/test/content/`: `selection.spec.ts`, `deck.spec.ts`, `registry.spec.ts`, `legacy-adapter.spec.ts`, `axis-selector.spec.ts` (mount ב-jsdom). הרצה: `CI=1 bunx vitest run test/content`.

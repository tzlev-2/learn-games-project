# בדיקות מערכת התוכן של הלוטו

הלוטו רץ על ה-ContentProvider הרב-צירי של הקיט (`learn-booster-kit`, `src/content/`).
בדיקות החוזה הגנרי (type guards, registry, בחירה, deck, adapter, `AxisSelector`) נמצאות בקיט:
`packages/learn-booster-kit/test/content/`.

## הרצה

```bash
CI=1 bunx vitest run --project server   # בדיקות node (Providers, הגדרות, לוגיקה)
CI=1 bunx vitest run                     # כולל browser — דורש Chromium של Playwright
```

## מה נבדק כאן

| קובץ | בדיקות | נושא |
|------|--------|------|
| `content/game-content.spec.ts` | 6 | הצהרת הלוטו, רישום ב-registry, fallback ל-provider לא מוכר |
| `content/providers/letters/index.spec.ts` | 25 | metadata, ציר `letters`, ברירות מחדל, `generateDeck`, תוכן כרטיס, התאמה, תהליך מלא |
| `content/providers/shapes/index.spec.ts` | 32 | כנ"ל + `colorMode`, צבעים ייחודיים אחרי `prepareForGame`, `SHAPES` |
| `content/providers/reading/index.spec.ts` | 36 | כנ"ל + `cardStyles`, `READING_ITEMS` |
| `stores/settings-schema.spec.ts` | 20 | מיגרציות v1→v2→v3 דרך מנוע הקיט, אימות שדות, round-trip |
| `utils/gameLogic.spec.ts` | 5 | `generateCards` מול Providers אמיתיים |

## Immutability

`generateDeck` וכל פונקציות הבחירה בקיט מחזירים מערכים/אובייקטים חדשים ולא משנים את הקלט — כל spec של Provider בודק זאת (`should not mutate selection`, `should return new array each call`).

## Provider חדש

ראה `docs/creating-content-provider.md` §2 שלב 7.

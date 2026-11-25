# יומן פיתוח - kit-test-screen

## 2026-11-25 20:24 — דוגמת פאנלים לפי ערכת המשחק (`S3.2`)

בורר הערכות ב־`src/routes/+layout.svelte` כולל `passcode` ומבדיל בינו לבין `slate` הבהירה; התוויות החדשות מרוכזות ב־`src/lib/language.ts`. דוגמת `/showcase/settings` יורשת את בחירת הערכה מהמסמך: בחירת `slate` מציגה כרטיסים בהירים שקופים על גרדיאנט המיון הצהוב, ובחירת `passcode` מציגה כרטיסים כהים שקופים על גרדיאנט slate. אין עוד קיבוע מקומי של `data-theme="slate"` שחוסם את הבורר.

שני השדות ב־`SettingsDemoFields` ותיבת הערכים בפועל מקבלים את טוקני הפאנל, כולל `field-bg` ו־`field-text` בתוך הפקדים. הבורר, תחום העריכה, ניהול הפרופילים ושמירת המחזק מגיעים מהמסך המשותף. לוגיקת האתחול וה־Result נשארה ללא שינוי, ואומתה גם בהשוואת AST לבסיס `S3.1`.

`check` עבר עם אפס שגיאות ותשע אזהרות קיימות; בדיקות אתחול הדוגמה עברו במסגרת 566 בדיקות הקיט. Svelte MCP בדק את ה־layout ואת רכיבי הדוגמה ללא ממצאים. פרטי המסירה והלוגים ב־`orchestrator-tasks/learn-games-integration-20261125/artifacts/s3.2.md` מחוץ לריפו. הבנייה, צילום `slate` על צהוב וצילום `passcode` על כהה, וכן מדידת ניגודיות הפיקסלים, נשארים למתזמר לפי חלוקת העבודה. המבצע לא הפעיל שרת, מנהרה או דפדפן.

### איסוף המתזמר — בנייה ואימות חי

שלוש הבניות עברו: passcode לשורש, passcode ל־lg והדוגמה. קובצי המוצר תואמים בטביעות למקור שנמסר. passcode נפרס רק ל־lg-passcode ונבדק דרך https://integration.learn-games.pages.dev/games/passcode/ . root עבר 37 בדיקות במשחק, עשר בדוגמה ושלוש בדיקות סגנון על תשעה פקדי web פנימיים, כולל placeholder ומתגים. ששת תרחישי S3 עברו שוב; מעבר פרופיל 91ms אחרי עריכת המחזק שמר את השינוי, וכשל אחסון וניסיון חוזר לא איבדו טיוטה.

צילומי מקור/חדש, מצבי פרופילים, מחזק וניהול בסוף נשמרו ב־1024×768 בתיקיית המשימה מחוץ לריפו; תמונת ההשוואה 2048×768 מחברת את המקור משמאל לחדש מימין ללא עיבוד, ובדיקת פיקסלים מאמתת זאת. דגימת פיקסל הכרטיס המורכב מול הטקסט הראשי והמשני עברה בראש ובתחתית הרקע הכהה ועל הצהוב; המינימום 6.13:1 מול יעד 4.5:1. כל 15 כתובות הייצור נשארו עם HTML זהה לבסיס. המאמת העצמאי השלים check/tsc, 566 בדיקות קיט ושש בדיקות passcode; האימות העצמאי הסתיים ב־PASS עם 50 בדיקות חיות, מעבר בתוך 60ms, בדיקת פיקסלי ניגודיות, השוואת הצילומים ו־15 כתובות ייצור ללא שינוי; התאמת הקומיט נבדקת לפני המיזוג. ללא בדיקת Drive/Fully אמיתיים בשל env ומכשיר חסרים.

---

## 2026-11-25 19:00 — דוגמת הפאנל הבהיר על רקע המיון (`S3.1`)

דוגמת `/showcase/settings` משתמשת ב־`SettingRow` עבור שני שדות המשחק במקום `OverriddenMark` חיצוני. השדות רוכזו ב־`SettingsDemoFields.svelte`, שמתחבר ל־Svelte context של המסך ומוסר לחיווי השמירה את ה־`Result` האמיתי; אין כתיבה מתוך מינוי לצורך החיווי. מעטפת הנתיב קובעת `data-theme="slate"` ורקע מעבר צבעי amber/orange/yellow כמו הרקע של sort-cards, כדי לאפשר צילום השוואה של הפאנל הבהיר ברוחב `42rem`. בורר התחום, הפרופילים, המחזק וחיווי השמירה מגיעים מ־`GameSettingsPage` המשותף.

הדוגמה ממשיכה להמתין ל־`initializeBooster()` לפני יצירת הטופס; תחום כללי מציג ערכים כלליים ותחום פרופיל מציג ערכים אפקטיביים. `check` עבר; בדיקות האתחול המושהה והכושל הורצו כחלק מבדיקות Node/jsdom של הקיט. `svelte-autofixer` נקי ברכיבי הדוגמה. תוצאות ולוגים סופיים ב־`orchestrator-tasks/learn-games-integration-20261125/artifacts/s3.1.md` מחוץ לריפו.

הבנייה עברה. preview זמני ומנהרה ציבורית שימשו לאימות חי של slate על רקע sort-cards: נמדדו כרטיסים לבנים, טקסט וגבול קבועים, רוחב 672px ומעטפת שקופה; חיווי שמירת המשחק וניקויו עברו גם בדוגמה. root עבר שש בדיקות דוגמה, ומאמת עצמאי אימת אותה כחלק מ־41 בדיקות חיות. צילום 1024×768 נשמר בתיקיית המשימה. השרת והמנהרה נסגרו לאחר האימות. בדיקות browser/e2e מקומיות לא הורצו לפי מגבלת המשימה; בדיקות jsdom אינן משמשות ראיה לגאומטריה.

## 2026-11-25 17:42 — דוגמת מסך הגדרות כללי ודריסות פרופיל (`S2`)

### מה בוצע?

- נוסף הנתיב `/showcase/settings` וקישור בתפריט. זהו showcase למפתחים, ללא שער מנהל, כמו שאר דוגמאות היישום.
- הדוגמה משתמשת ב־`GameSettingsPage`, ב־`defineGameSettings` עם ArkType וב־`OverriddenMark` עבור `cooldownMs` ומספר אפשרויות. מחרוזות הדוגמה והקישור מרוכזות ב־`src/lib/language.ts`.
- בתחום הכללי העורכים מציגים `getGeneral`; בתחום פרופיל הם מציגים `get`. תיבה נפרדת מציגה תמיד את הערכים האפקטיביים של המשחק. החלפת תחום או פרופיל אינה מעתיקה ערכים לכללי, וכתיבה נעשית רק באירוע שינוי שדה.
- הניווט חזרה נשאר ביישום דרך `goto` ו־`base`; הקיט מקבל callback בלבד. הנתיב מוגדר `ssr=false` כדי שידית הדוגמה תיווצר מול אחסון הדפדפן.
- `+page.svelte` עוטף את `_components/SettingsDemo.svelte`. הרכיב ממתין במפורש ל־`await initializeBooster()` לפני יצירת `GameSettingsPage`; עד אז מופיע מצב טעינה, ובכשל מוצגת הודעה בלי ליצור טופס שיכול לשמור defaults.
- `src/lib/booster-init.ts` מחזיק Promise משותף ל־layout, לדוגמה ולמסך הבדיקה הראשי. ה־layout יוצר את `BoosterContainer` רק לאחר השלמתו כדי שהקריאה הפנימית של הקונטיינר ל־`init` לא תתחיל אתחול מתחרה לפני ההמתנה המשותפת. אין שינוי בשכבת config של הקיט.

### בדיקות

- `svelte-autofixer` עבר ללא אבחונים או הצעות בדוגמה וב־layout.
- בבדיקת `bun run check` הראשונה נמצאה תלות חסרה: `arktype` לא היה מוצהר במניפסט היישום. המתזמר הוסיף את התלות למניפסט ול־`bun.lock` וביצע התקנה סדרתית; המבצע לא שינה קבצים אלה. הבדיקה החוזרת עברה ללא שגיאות, עם תשע אזהרות קיימות ברכיבי המחזק הישנים.
- בדיקות הקיט עברו: 538 בדיקות, כולל שמונה בדיקות UI על המסך החדש ותאימות `Settings` הישן, ושתי בדיקות של `SettingsDemo` עם אתחול מושהה/נכשל ובדיקה של שיתוף Promise. התרחיש המושהה שומר `turnsPerReward=9` מול store התחלתי עם 1, מוודא שאין טופס גם אחרי חלון השמירה האוטומטית, משלים את האתחול ואז עורך ל־6 ומוודא שמירה והרכבה חוזרת. בדיקות דפדפן ו־e2e לא הורצו, בהתאם למגבלת המשימה.
- הבנייה עברה. המתזמר אימת דרך preview ומנהרה זמנית את שלושת מצבי הפרופילים, כללי/דריסה, איפוס, שימור ברענון ומחזק נפרד; צילומי 1024×768 נשמרו מחוץ לריפו. נבדקו גם slate וגלילה עד סוף הטופס במסגרת מוגבלת. המנהרה תיסגר באיסוף השלב.

### מעקפים ופתרונות

- Prettier עם תצורת היישום נכשל ב־plugin של Tailwind על import קיים של `learn-booster-kit/styles.css`, שאינו ב־exports של החבילה. הקבצים החדשים עוצבו באמצעות Prettier עם plugin של Svelte והעדפות העיצוב של היישום, בלי plugin של Tailwind; לא השתנתה תצורה מחוץ להיקף.

## 2026-05-17 — קומיט 20: SVG hero ב-Welcome במקום emoji

### מה בוצע?

**`showcase/welcome/+page.svelte`** — החלפת `🎮` emoji ב-SVG פנימי:
- snippet `heroIllustration`: `<span class="emoji">🎮</span>` → `<svg>` של מחוון משחק מינימליסטי (D-pad + 2 כפתורים, stroke-based)
- `aria-hidden="true"` על `.hero` (אלמנט דקורטיבי)
- `.hero` style: הוספת `color: var(--theme-text-on-brand)` לצביעת SVG דרך `currentColor`
- הסרת `.emoji` rule לחלוטין
- סיבה: `🎮` מופיע כ-□ (tofu) בלינוקס headless ובחלק מהדפדפנים

## 2026-05-17 — קומיט 17: תיקון ProgressWidget גובה

### מה בוצע?

**`showcase/game/+page.svelte`** — תיקון layout שגרם ל-ProgressWidget להימתח לכל גובה האזור (~800px):

- `.game-area-wrap`: הוספת `align-items: flex-start` — ביטול ברירת המחדל `stretch` שגרמה למתיחה
- `.progress-mock`: הוספת `flex-shrink: 0` — מנע כיווץ לא רצוי ברוחב בעת flex-start

## 2026-05-17 00:25

### שיפור מסך game להתאמה למקור

#### מה בוצע?

**`showcase/game/+page.svelte`** — 4 שיפורים:

1. **color="secondary"** ל-SpeakerIcon IconButton — כתום ב-find-letter, צהוב ב-wordys, rose ב-portal
2. **subtitle בHeaderBar** — "הקשיבו וגעו באות הנכונה" (`.title-wrap` + `.subtitle`)
3. **ProgressWidget mock** — `<aside class="progress-mock">` עם track/fill ו-`progressPct = $derived((score%12)/12*100)`
4. **Grid עטוף ב-`Card variant="framed"`** — מסגרת כתומה ב-find-letter, ניטרלי בשאר

**`Card.svelte`** — תיקון: `ribbonStyle` הפך ל-`$derived` (מנע Svelte warning)

## 2026-05-17 00:12

### מסך משחק אינטראקטיבי לבחינת themes

#### מה בוצע?

**`src/routes/showcase/game/+page.svelte`** — פסאודו-משחק "מצא את האות"

- `GameShell` + `HeaderBar` מלא: SpeakerIcon+label, כפתור משחק חדש, SegmentedControl גודל לוח, ScoreBadge ×2, SettingsIcon
- גריד כרטיסים בCSSgrid: 2×3 / 3×3 / 3×4 לפי בחירה
- `lbk-anim-shake` על תשובה שגויה, `lbk-anim-pop` על תשובה נכונה
- `CooldownOverlay` 2.5s אחרי טעות
- `generateRound`: 1 target + distractors מ-LETTERS, Fisher-Yates shuffle
- `$effect` יחיד לinit + מעקב אחרי gridSize דרך `gridCount(gridSize)`
- nav link "Game" ב-layout

#### מעקפים ופתרונות

- **infinite loop בסיכון**: `$effect` מריץ `generateRound` שמשמש `targetLetter` → tracking. פתרון: מחיקת השורה `const available = LETTERS.filter(l => l !== targetLetter)` שלא הייתה נחוצה, ומחיקת `$effect` כפול

## 2026-05-17 00:11

### מסך ברוכים הבאים לבחינת themes

#### מה בוצע?

**`src/routes/showcase/welcome/+page.svelte`** — מסך פתיחה מלא

- `GameShell` + `StartScreen` מהקיט במסך מלא
- `heroIllustration` snippet: gradient box 200×200 עם אמוג'י 🎮
- `secondaryActions`: IconButton הגדרות + קישור חזרה
- primary action מנווט ל-`/showcase/game`

**`+layout.svelte`** — הוספת nav link "Welcome"

## 2026-05-17 00:10

### הרחבת theme switcher — 8 themes

#### מה בוצע?

- `+layout.svelte`: הרחבת Theme type + 5 options חדשות (Find Letter, Wordy's, Slate Dark, Read Faster, Portal)
- שחזור השינויים הידניים שנמחקו בטעות בקומיט e28d32c (theme switcher בשלמותו)

#### מעקפים ופתרונות

- הקובץ היה ב-working tree (uncommitted) עם השינויים הידניים — נשמרו ועודכנו במקום לדרוס

## 2026-05-17 00:08

### תיקון: layout.css — @import עם .css extension מפורש

#### מה בוצע?

- `layout.css`: שינוי `@import 'learn-booster-kit/styles'` → `@import 'learn-booster-kit/styles.css'`

#### מעקפים ופתרונות

- **Tailwind 4 loadStylesheet**: Tailwind לא מוסיף `.css` extension אוטומטית ב-@import paths — הוא פותח את הpath כמו שהוא. Vite alias מחזיר `src/styles` (ללא extension) וTailwind נכשל ב-ENOENT. הפיתרון: הוספת `.css` מפורש לimport.
- הבעיה הייתה pre-existing (קיימת לפני הפרויקט הזה) — ה-SSR dev server לא עבד כלל בלי התיקון הזה.

## 2026-05-17 00:07

### Showcase page — הצגת כל קומפוננטות ה-component system + theme switcher

#### מה בוצע?

**1. `src/routes/showcase/+page.svelte`** — דף showcase חדש

- מציג את כל הprimitives: Button, IconButton, SegmentedControl, ScoreBadge, Card
- מציג animation hooks: useShake, usePop
- מציג CooldownOverlay (3 שניות)
- מציג HeaderBar עם 3 אזורים
- מציג StartScreen בתוך preview box
- swatches לכל Color Tokens
- RTL מלא

**2. `src/routes/+layout.svelte`** — עדכון עם theme switcher

- navigation: Booster Test / Showcase
- `<select>` לבחירת theme: default/kids/minimal
- `$effect` מגדיר `document.documentElement.dataset.theme` ב-runtime
- CSS variables משתנים מיד עם החלפת theme

#### החלטות ארכיטקטורה

- **`data-theme` על `<html>`**: שינוי theme-attribute על document.documentElement מפעיל את כל ה-CSS overrides של [data-theme='kids'] וכו'

## 2026-02-21 00:00

### הסרת @source עם path יחסי ל-learn-booster-kit

#### מה בוצע?

**1. `src/routes/layout.css`**

- הוחלף `@source '../../../../packages/learn-booster-kit'` ב-`@import 'learn-booster-kit/styles'`.

**2. `vite.config.ts`**

- ה-alias של `learn-booster-kit` שונה מ-`src/index.ts` (קובץ ספציפי) ל-`src/` (ספרייה).
- כך `learn-booster-kit` → `src/index.ts` ו-`learn-booster-kit/styles` → `src/styles.css`.

#### החלטות ארכיטקטורה

- **שינוי alias לספרייה**: כשה-alias מצביע לספרייה (ולא לקובץ ספציפי), Vite מפנה sub-paths כמו `/styles` לקבצים בספרייה. זה מאפשר הרחבה עתידית (למשל `learn-booster-kit/types`) ללא שינוי בconfig.

---

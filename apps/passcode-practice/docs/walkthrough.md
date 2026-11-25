# Passcode Practice — יומן פיתוח

## 2026-11-25 16:59

### תבנית בנייה אחידה לדומיין המשותף

`LG_BUILD=1` מפעיל בסיס `/games/passcode`; `wrangler.lg.jsonc` שומר פלט נפרד ב־`.svelte-kit/cloudflare-lg`. פקודות `build:lg` ו־`deploy:lg` מחליפות את הפיילוט ומפרסמות רק את פרויקט `lg-passcode`. מנגנון הבנייה לשורש נשאר פעיל דרך `wrangler.jsonc`. `bun run check` עבר; שתי הבניות עברו; תוצר ה־lg נפרס לפרויקט הייעודי והחזיר 200 דרך פורטל האינטגרציה.

---

## 2026-11-19 11:00

### מיגרציה לקומפוננטות ול-theme של הקיט (שלב 5)

ה-header וה-TTS עברו ל-`learn-booster-kit`, וה-theme הוא `slate` (header כהה). הרקע הכהה
בסגנון מסך נעילה נשאר של המשחק.

#### מה בוצע?

- **Theme** — `<html data-theme="slate">`; ‏`app.css` מייבא את `learn-booster-kit/styles`;
  הפונט `--theme-font-body`. ‏`--color-correct/wrong` שלא היו בשימוש נמחקו.
- **Layout** — `GameShell layout="fill" background="none"` עם `HeaderBar balanced`: בית
  (`IconButton` + `HomeIcon`, מאפס את המשחק כמו קודם), `ScoreBadge` להצלחות, והגדרות
  (`AdminGate` + `SettingsIcon`). ‏`HeaderBar.svelte` ו-2 ה-SVG נמחקו.
- **מסך המשחק** — `<main>` הפך ל-`<div>` (ה-shell כבר מספק `<main>`); תווית ה-ProgressWidget
  ו"שניות להמתנה" עברו ל-`language.ts`.
- **הגדרות** — "חזרה" הוא `Button` של הקיט (slate-700 ו-`rounded-xl` כמו במקור).
- **TTS** — `tts.ts` משאיר רק את המשפטים של המשחק מעל `speakText` של הקיט. למשחק אין
  `sound.ts` ואין ערבוב.
- **`language.ts`** (חדש, `src/lib/services/`).

#### בדיקות

- `bun run check`: ‏6 שגיאות / 10 אזהרות → **0 / 10** (ה-`declare global` של `tts.ts` המקומי).
- `bun run build` עובר. אין בדיקות יחידה. צילומים: `learn-games-reports/p5/passcode/`.

#### מה לא הוחלף

- **פאנלי ההגדרות** — לבן שקוף (`bg-white/10`) על הרקע הכהה; `Card` של הקיט הוא משטח בהיר.
- **ספירת ההמתנה** — pill אדום קטן ("N שניות להמתנה") ולא טבעת; אין רכיב קיט מקביל.
- לוח המקשים, הנקודות, הרמז ו-`FeedbackOverlay`.

#### הבדלים ויזואליים ידועים

1. ה-header: מונה ההצלחות ב-pill ירוק (`ScoreBadge`); כפתורים לבן שקוף; גבוה ב-1px.
2. פונט `system-ui` של `slate` במקום `"Segoe UI"` (זהה בפועל ב-Windows).

---

## 2026-04-03 22:30

### מצב תרגול עיוור + כפתור רמז עם צינון

הוספת מצב תרגול בו הסיסמא מוסתרת: כל ספרה נבדקת בנפרד עם חיווי ירוק/אדום, וכפתור "💡 רמז" מציג את הסיסמא לזמן קצוב ואז נכנס לצינון.

#### שינויים

##### מצב עיוור — בדיקה פר-ספרה

- כשׁ-`showHint = false`: כל לחיצה בודקת את הספרה לפי מיקומה בסיסמא
- נקודות `PasscodeDots` צובעות ירוק (`correct`) / אדום (`wrong`) בזמן אמת
- על שגיאה: רק הספרה השגויה נמחקת אחרי cooldown — הספרות הנכונות שהוכנסו נשמרות
- כשׁ-`showHint = true`: התנהגות מקורית ללא שינוי (בדיקה כוללת בסוף)

##### כפתור רמז עם 2 טיימרים סדרתיים

- כפתור "💡 רמז" מופיע כשׁ-`showHint = false`
- לחיצה: שלב 1 — הסיסמא גלויה + SVG countdown אמבר (`hintVisibleMs` שניות)
- לאחר הסתרה: שלב 2 — SVG countdown לבן (`hintCooldownMs` שניות המתנה)
- רק לאחר שניהם הכפתור חוזר לזמינות
- הגדרות בדף ההגדרות: שדות `<input type="number">` חופשיים לשני הזמנים

##### שינויים ב-Store

- `settings.svelte.ts`: נוספו `hintVisibleMs` (ברירת מחדל 3 שנ׳) ו-`hintCooldownMs` (8 שנ׳); תוקן guard של `localStorage` מ-`typeof globalThis?.localStorage` ל-`browser` מ-`$app/environment` (SSR bug בVite 7)
- `game-state.svelte.ts`: נוספו `digitStatuses`, `hintCooldownUntilTs`, `hintVisibleUntilTs`; `useHint()` מגדיר את שני הטיימרים בסדרה

#### החלטות עיצוב

- **הספרות הנכונות נשמרות על שגיאה**: במקום `clear()` מלא, בלוק השגיאה עושה `entered.slice(0, pos)` — כך התלמיד ממשיך מהנקודה שטעה ולא מההתחלה, מה שמפחית תסכול.
- **2 טיימרים סדרתיים** (`hintVisibleUntilTs` + `hintCooldownUntilTs`): `hintCooldownUntilTs = now + hintVisibleMs + hintCooldownMs` — כך הכפתור נעול כל הזמן ב-2 שלבים בלי צורך ב-`setTimeout` נוסף.
- **`<input type="number">` לשדות הרמז** (במקום range slider): מאפשר הקלדה חופשית כדי שהמורה יוכל להגדיר כל מספר שניות.

#### מעקפים

- **`localStorage.getItem is not a function` ב-SSR (Bun + Vite 7.3)**: Bun מגדיר `globalThis.localStorage` כ-object (מה-`--localstorage-file` flag) אבל `.getItem` לא עובד ב-SSR. הפתרון: החלפת הבדיקה ב-`import { browser } from "$app/environment"` — הדרך הסטנדרטית ב-SvelteKit שלא מסתמכת על גלובלים.

---

## 2026-03-02 14:00

### גרסה v0.1 — יצירת האפליקציה מאפס

אפליקציית SvelteKit לתרגול הקשת סיסמת אייפד. התלמיד מתאמן על הקשת הסיסמא על לוח ספרות דיגיטלי בסגנון מסך הנעילה של iOS, עם רמז אופציונלי, מחזקים ומשוב קולי.

#### מה בוצע?

**1. תשתית הפרויקט**

- יצירת פרויקט SvelteKit חדש במונורפו תחת `apps/passcode-practice/`
- הגדרת `package.json` עם `learn-booster-kit` כתלות
- הגדרות `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.npmrc`
- Tailwind CSS v4 עם `@tailwindcss/vite`

**2. Store — הגדרות מורה (`settings.svelte.ts`)**

- שדות: `passcode` (ברירת מחדל `"1234"`), `showHint`, `cooldownMs`, `voiceEnabled`, `speakDigits`, `boosterEnabled`
- שמירה אוטומטית ב-`localStorage` עם `$effect.root`
- `isPasscodeValid` — ולידציה: ספרות בלבד, לפחות 1 תו

**3. Store — מצב משחק (`game-state.svelte.ts`)**

- State Machine: `IDLE → ENTERING → ERROR / SUCCESS → REWARD`
- בדיקה אוטומטית אחרי הקשת כל הספרות (ללא כפתור אישור) — מחקה התנהגות אייפד אמיתי
- `pressDigit`, `backspace`, `clear`, `completeReward`, `reset`
- `winsSinceLastReward` — מוניטור להפעלת מחזק

**4. TTS (`tts.ts`)**

- `speakSuccess`, `speakWrong`, `speakDigit` — הכרזות בעברית
- שרשרת fallback: Fully Kiosk → Web Speech API → שקט

**5. קומפוננטות משותפות (lib/components)**

- `HeaderBar.svelte` — כותרת עם מונה הצלחות, AdminGate לגישה להגדרות

**6. קומפוננטות ספציפיות לראוט (routes/_components)**

- `NumericKeypad.svelte` — לוח 3×4 בסגנון iPad (שורות: 1-2-3, 4-5-6, 7-8-9, ריק-0-מחיקה)
- `PasscodeDots.svelte` — נקודות התקדמות (כמות הנקודות = אורך הסיסמא), אנימציה על שגיאה/הצלחה
- `PasscodeHint.svelte` — כרטיס רמז מעל הלוח (מוצג כשׁ-`showHint=true`)
- `FeedbackOverlay.svelte` — overlay הצלחה (ירוק + כוכבים) / שגיאה (אדום)

**7. עמודים**

- `+layout.svelte` — רקע gradient כהה (slate-800→900) מחקה מסך נעילה iOS, BoosterContainer ב-z-[9999]
- `+page.svelte` — עמוד ראשי: ProgressWidget, PasscodeHint, PasscodeDots, ספירת cooldown, NumericKeypad, FeedbackOverlay
- `settings/+page.svelte` — הגדרות מורה: סיסמא (password + show/hide), showHint, cooldown slider, הגדרות קול, הגדרות מחזק (BoosterKit מלא כולל OverlayTimerSettings)

#### החלטות ארכיטקטורה

- **קומפוננטות ספציפיות לראוט ב-`routes/_components/`**: על פי קונבנציית הפרויקט — קומפוננטות השייכות לראוט אחד בלבד נשמרות בתוך תיקיית הראוט, קומפוננטות משותפות ב-`lib/components/`.
- **בדיקה אוטומטית ללא כפתור Submit**: מחקה התנהגות אייפד אמיתי — לאחר הקשת כל ספרות הסיסמא הבדיקה מתבצעת מיידית.
- **אורך סיסמא דינמי**: `PasscodeDots` רספונסיבי ל-`settings.passcode.length` — תומך בכל אורך (1–8 ספרות) ללא שינוי קוד, רק שינוי הסיסמא בהגדרות.

#### מעקפים ופתרונות

- **`dir="ltr"` על תצוגת הסיסמא**: המסמך הוא RTL (עברית), אך ספרות הסיסמא חייבות להיות LTR כדי שהסדר יהיה נכון (1234 ולא 4321).
- **שגיאות svelte-check ב-`learn-booster-kit`**: 11 שגיאות קיימות מראש בחבילה (fully-kiosk-js types), זהות לשגיאות בפרויקטים אחרים במונורפו — לא מהקוד שלנו.

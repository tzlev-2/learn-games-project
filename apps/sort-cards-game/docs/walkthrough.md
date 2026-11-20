# יומן פיתוח - משחק מיון כרטיסים

## 2026-11-19 10:53

### מסך פתיחה — גודל תת-הכותרת

תת-הכותרת חזרה ל-24px ממסך 768px ומעלה (`text-xl md:text-2xl` כמו במקור) — דריסה מקומית
של `--theme-font-size-lg` על `.sc-start`. כותרת התצוגה של `slate` עודכנה בקיט ל-`6vw`
(60px גם ב-1097×685).

---

## 2026-11-19 10:50

### מיגרציה לקומפוננטות ול-theme של הקיט (שלב 5)

המשחק עבר לקומפוננטות המשותפות של `learn-booster-kit` ול-theme ‏`slate` (header כהה
ורקע צהבהב — ה-theme נבנה מלכתחילה על בסיס המשחק הזה). ה-header, טבעת ההמתנה,
וקבצי הסאונד וההקראה המקומיים הוחלפו בגרסאות של הקיט.

#### מה בוצע?

- **Theme** — `<html data-theme="slate">` ב-`app.html`; ‏`app.css` מייבא את
  `learn-booster-kit/styles`; הפונט הוא `--theme-font-body`. CSS לא בשימוש
  (`.btn-large`, `--color-correct/wrong`) נמחק.
- **Layout `(app)`** — `GameShell layout="fill" background="none"` מעל ה-gradient של
  המשחק, עם `HeaderBar balanced`: כפתור בית (`IconButton` + `HomeIcon`), שני `ScoreBadge`
  (כרטיסים — ירוק, נכון — צהוב) והגדרות (`AdminGate` + `IconButton` + `SettingsIcon`).
  ‏`HeaderBar.svelte`, ‏`home.svg` ו-`settings.svg` המקומיים נמחקו.
- **מסך פתיחה** — `StartScreen layout="fill"`; בורר החבילות עובר כ-`children` (עכשיו
  `radiogroup` עם `aria-checked`), וה-CTA הוא `Button` של הקיט בצבע `secondary` עם
  ה-gradient הירוק וה-🎮 של המשחק (override מקומי דרך `class`).
- **משחק** — `CooldownTimer.svelte` הוחלף ב-`CooldownRing` של הקיט (אותה טבעת inline,
  תופסת מקום גם כשאין המתנה).
- **הגדרות** — הסקשנים הם `Card`, "חזרה" הוא `Button`, ו"מצב משחק" (2 אפשרויות) עבר
  מ-`select` ל-`SegmentedControl`.
- **סאונד / TTS / ערבוב** — `sound.ts` הוא `createUiSounds` של הקיט (אותם קבצים ועוצמות),
  `tts.ts` משאיר רק את המשפטים של המשחק מעל `speakText`, ו-`shuffle` המקומי הוחלף
  ב-`shuffleArray`.
- **`language.ts`** (חדש, `src/lib/services/`) — המחרוזות של הקוד שהשתנה: header,
  מסך פתיחה, טבעת ההמתנה, משפטי ה-TTS, כותרת ההגדרות ומצב המשחק.

#### בדיקות

- `bun run check`: ‏6 שגיאות / 15 אזהרות → **0 / 13**. ‏6 השגיאות נבעו מ-`declare global`
  על `Window.fully` ב-`tts.ts` המקומי, שהתנגש בהצהרה של הקיט.
- `bun run build` עובר.
- צילומי לפני/אחרי (1097×685, 1024×768): `learn-games-reports/p5/sort-cards/`.

#### הבדלים ויזואליים ידועים

1. ה-header: ערכי הניקוד ב-pill צבעוני (`ScoreBadge`) במקום טקסט עם קו מפריד.
2. כפתורי ה-header: לבן שקוף על הכהה במקום `slate-700`; האייקון לבן 75%.
3. פינות כרטיסי ההגדרות 8px במקום 16px — ה-build הכפול של Tailwind (דרך
   `SiteBoosterMain` של הקיט) דורס את `--radius-lg` של ה-theme. בעיה קיימת בקיט.
4. הכותרת במסך הפתיחה מעט נמוכה יותר בגובה 685 (ריווח `gap-8` של `StartScreen`).

#### מה לא הוחלף

`RoundComplete` ו-`FeedbackOverlay` (מסכי חגיגה של המשחק, כפתורי gradient סגול/ירוק),
`DraggableCard` ו-`SortBox` נשארו מקומיים.

---

## 2026-02-26 16:30

### TTS עם הקשר, ווידג'ט כרטיסים, לחצן בדיקת מחזק, ומניעת לחיצה כפולה על פרס

שיפורים ותיקונים למשחק: TTS מקריא את שם האות ושם הקטגוריה, ProgressWidget סופר כרטיסים במקום סיבובים, לחצן בדיקת מחזק בהגדרות, וכפתור "קבל פרס" חסום לאחר לחיצה ראשונה.

#### מה בוצע?

**1. TTS עם הקשר — שם כרטיס + שם קטגוריה**

- `speakCorrect` מקבל שם קטגוריה וטקסט כרטיס, מקריא: "בָּ, יש כוח! כל הכבוד!" / "כלב, חיות! כל הכבוד!".
- נוסף שדה `ttsText` ל-`SortCard` — לטקסט הקראה שונה מהתצוגה.
- בחבילת "יש כוח": אותיות עם קמץ משתמשות ב-image כמות שהוא, עיצורים בלי תנועה מקבלים שווא ("גְ", "בְּ") כניסיון לגרום ל-TTS לבטא את הצליל.

**2. ProgressWidget — ספירת כרטיסים**

- הווידג'ט עבר מספירת סיבובים לפרס (`winsSinceLastReward`) לספירת כרטיסים מוינים בסיבוב (`sortedCardsInRound / totalCardsInRound`).
- נוספו getters ל-`GameStateStore`: `totalCardsInRound`, `sortedCardsInRound`.
- הווידג'ט מוצג תמיד (לא רק כש-booster מופעל).

**3. לחצן בדיקת מחזק**

- נוסף כפתור "בדיקת מחזק" בתוך סקשן הגדרות ה-booster, קורא ל-`boosterService.triggerReward()`.

**4. כפתור "קבל פרס" — מניעת לחיצה כפולה**

- `RoundComplete` מקבל `rewardPending` כ-prop, כפתור הפרס הופך ל-`disabled` עם `opacity-50` ו-`cursor-not-allowed` לאחר הלחיצה הראשונה.
- זהה לדפוס של `train-addition-game`.

**5. HeaderBar — ספירת כרטיסים**

- הוחלף "סיבוב: X" ב-"כרטיס: X/Y" (מוינו/סה"כ בסיבוב).

## 2026-02-26 14:00

### הוספת הגדרות Booster מלאות, טיימר Cooldown עגול ו-TTS

הוספת שלושה פיצ'רים שחסרו: הגדרות booster מלאות בדף ההגדרות (כמו ברכבת החיבור), טיימר cooldown ויזואלי עגול במקום פופאפ נתקע, ו-TTS עם תמיכה ב-Fully Kiosk.

#### מה בוצע?

**1. הגדרות Booster מלאות (דף הגדרות)**

- הוחלף ה-checkbox הפשוט של "הפעלת חיזוקים" בסקשן מלא עם: סוג פרס (וידאו/אפליקציה/אתר), תורות לחיזוק, משך פרס בשניות, מקור וידאו (מקומי/גוגל דרייב), בחירת אפליקציה מרשימת Fully Kiosk, כתובת אתר.
- מבנה הקוד מבוסס על הדפוס מ-`train-addition-game/SettingsControls.svelte`.
- אנימציית `slide` בפתיחת סקשן ההגדרות.

**2. טיימר Cooldown עגול (SVG)**

- הוסר הפופאפ הכתום (`FEEDBACK_WRONG`) מ-`FeedbackOverlay.svelte`.
- נוצר קומפוננט `CooldownTimer.svelte` עם עיגול SVG מתמלא, ספירה לאחור במרכז, עדכון כל 100ms.
- הטיימר מוצג מתחת לכרטיס באזור המשחק (inline, לא overlay).
- נוספה הגדרת `resetCooldownOnTap` — גרירה לארגז בזמן cooldown מאפסת את הטיימר מחדש.

**3. TTS — הקראת משוב בקול**

- נוצר `tts.ts` עם שרשרת fallback: Fully Kiosk TTS → Web Speech API → silent.
- מקריא "כל הכבוד!" בתשובה נכונה ו-"לא נכון, נסה שוב" בטעות.
- מופעל רק כש-`voiceEnabled` דלוק בהגדרות (כבוי כברירת מחדל).
- הוספת toggle "הקראת משוב" בדף ההגדרות.

**4. עדכון סכמת הגדרות**

- `TeacherSettings` הורחב עם `voiceEnabled: boolean` ו-`resetCooldownOnTap: boolean`.
- כל השדות החדשים נוספו ל-load/save/reset ב-`SettingsStore`.

## 2026-02-26 12:00

### יצירת משחק מיון כרטיסים — גרסה ראשונה

משחק חינוכי חדש שבו התלמיד גורר כרטיסים לתוך ארגזים (קטגוריות). תומך ב-2+ ארגזים, חבילות תוכן מובנות, ומנגנון חיזוקים (Gingim Booster).

#### מה בוצע?

**1. תשתית**

- אפליקציית SvelteKit 5 חדשה עם Svelte 5 runes, Tailwind CSS v4, Cloudflare Pages adapter.
- אינטגרציה עם `learn-booster-kit` (BoosterContainer, ProgressWidget, AdminGate, boosterService).
- שמירת הגדרות ב-localStorage עם schema versioning.

**2. מנוע משחק (State Machine)**

- מצבים: INIT → PLAYING → FEEDBACK_CORRECT/WRONG → ROUND_COMPLETE → REWARD_TIME → GAME_COMPLETE.
- תמיכה במצב ידני (כפתור "הבא") ומצב רציף (מעבר אוטומטי).
- cooldown לאחר טעות, ערבוב כרטיסים וסיבובים, הגבלת כרטיסים לסיבוב.

**3. Drag & Drop**

- מבוסס Pointer Events API עם `setPointerCapture` לתמיכה חוצת-מכשירים (עכבר + מגע).
- זיהוי ארגז יעד באמצעות `document.elementsFromPoint()` עם `pointer-events: none` זמני.
- אנימציית bounce-in לכרטיסים ואנימציית החזרה למקום בשחרור מחוץ לארגז.

**4. חבילות תוכן (6 מובנות)**

- "יש כוח - אין כוח" — אותיות בג"ד כפ"ת עם/בלי קמץ (תנועה = כוח, עיצור = אין כוח).
- חיות וצמחים, זוגי ואי-זוגי, מיון צורות, צבעים חמים וקרים, קבוצות מזון.
- כל חבילה תומכת ב-emoji לתמונה וטקסט לתוכן.

**5. ממשק משתמש**

- עיצוב חם עם גרדיאנט כתום-צהוב, כרטיסים לבנים עם צל, ארגזים צבעוניים.
- פונט Frank Ruhl Libre (Google Fonts) לתצוגת אותיות עבריות מנוקדות.
- דף בית עם בחירת חבילה, דף הגדרות מלא, HeaderBar עם AdminGate.

#### החלטות ארכיטקטורה

- **Pointer Events במקום HTML Drag & Drop**: ה-Drag & Drop API המובנה לא עובד טוב על מכשירי מגע ולא תומך ב-pointer capture. Pointer Events נותנים שליטה מלאה ותמיכה אחידה.
- **elementsFromPoint() לזיהוי יעד**: בזמן גרירה ה-`pointer-events` של הכרטיס מכבים רגעית כדי לאתר את הארגז מתחתיו — פשוט ואמין יותר מ-bounding box checks.
- **content ריק לחבילת "יש כוח"**: כרטיסי האותיות משתמשים ב-`image` בלבד (האות המנוקדת בפונט גדול) ו-`content: ""` — כך שהטקסט לא מוצג, רק האות הגדולה.

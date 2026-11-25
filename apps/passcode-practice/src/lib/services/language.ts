/**
 * שירות טקסטים — ריכוז המחרוזות שמוצגות למשתמש (ומוקראות ב-TTS).
 * קוד שעבר מיגרציה לקומפוננטות הקיט לוקח את הטקסטים מכאן.
 */

export const language = {
  pageTitle: "תרגול סיסמא",

  // === Header ===
  homeLabel: "חזרה לתפריט",
  settingsLabel: "הגדרות",
  successCountLabel: "הצלחות:",

  // === משחק ===
  progressLabel: "לפרס",
  cooldownSecondsLabel: "שניות להמתנה",

  // === הקראה (TTS) ===
  ttsSuccess: "כל הכבוד! הסיסמא נכונה!",
  ttsWrong: "לא נכון, נסה שוב",

  // === מסך הגדרות ===
  settingsPageTitle: "הגדרות - תרגול סיסמא",
  settingsHeading: "⚙️ הגדרות",
  backLabel: "חזרה",
  settingsLoading: "טוען הגדרות...",
  initializationError: "טעינת ההגדרות נכשלה. יש לרענן את הדף ולנסות שוב.",
  gameSettings: {
    passcode: "הסיסמא לתרגול",
    passcodeDescription: "הזן את קוד הגישה של האייפד (ספרות בלבד)",
    hidePasscode: "הסתר סיסמא",
    showPasscode: "הצג סיסמא",
    invalidPasscode: "הסיסמא חייבת להכיל ספרה אחת לפחות וספרות בלבד",
    passcodeLength: (length: number) => `אורך הסיסמא: ${length} ספרות`,
    showHint: "הצג רמז מעל הלוח",
    showHintDescription: "תצוגת הסיסמא לתרגול ראשוני עם הדגמה",
    voiceEnabled: "הקראת משוב",
    voiceDescription: 'הקראת "כל הכבוד" / "נסה שוב" בקול',
    speakDigits: "קריאת ספרות",
    speakDigitsDescription: "קריאת כל ספרה בעת לחיצה",
    boosterEnabled: "הפעלת חיזוקים",
    boosterDescription: "הפעלת מנגנון חיזוקים לאחר הצלחה",
    cooldown: "זמן המתנה בטעות",
    cooldownDescription: "משך חסימת לוח הספרות לאחר טעות",
    hintVisible: "זמן הצגת רמז",
    hintVisibleDescription: "שניות שהסיסמא גלויה במצב רמז",
    hintCooldown: "המתנה בין רמזים",
    hintCooldownDescription: "שניות לפני שאפשר לבקש רמז נוסף",
    seconds: (seconds: number) => `${seconds} שניות`,
    saveError: "שמירת הגדרות המשחק נכשלה. יש לבדוק את הערך ולנסות שוב.",
    reset: "איפוס הגדרות המשחק לברירת המחדל בתחום הנבחר",
  },
} as const;

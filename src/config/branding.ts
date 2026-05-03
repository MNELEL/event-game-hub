/**
 * 🎨 הגדרות מיתוג מרוכזות
 * ----------------------------------------
 * כל שם, אייקון, צבע וטקסט שיווקי של האפליקציה מוגדרים כאן.
 * עדכון במקום אחד = שינוי בכל האפליקציה.
 */

export const branding = {
  // שם האפליקציה
  name: "חיוש בת מצוה",
  fullName: "חיוש בת מצוה - משחק טריוויה אינטראקטיבי",
  shortName: "חיוש בת מצוה",
  authorName: "Chayoush",

  // אייקונים / אימוג'ים
  icons: {
    primary: "👑",
    festive: "👑✨🎀",
    legacy: "🧠", // ישן - לא לשימוש חדש
  },

  // טקסטים שיווקיים
  copy: {
    tagline: "חידון אינטראקטיבי מיוחד לכבוד בת המצווה",
    heroSubtitle: "כמה אתם מכירים את חיוש?",
    aboutDescription:
      "חיוש בת מצוה הוא חידון אינטראקטיבי מיוחד לכבוד בת המצווה — שאלות על חיוש,",
    lobbySubtitle: "חידון לכבוד בת המצווה",
  },

  // פרטי קשר
  contact: {
    phone: "03-7737970",
  },

  // מפתחות אחסון מקומי (localStorage)
  storage: {
    cacheKey: "chayoush_data",
    storageKey: "chayoush_data",
  },

  // צבעי מותג עיקריים (HSL ערכים מוגדרים ב-index.css כ-tokens)
  // המקור הוא tailwind.config.ts / index.css. כאן רק רפרנסים נוחים.
  colors: {
    goldToken: "game-gold",
    darkGoldToken: "game-dark-gold",
    parchmentToken: "game-parchment",
  },
} as const;

export type Branding = typeof branding;

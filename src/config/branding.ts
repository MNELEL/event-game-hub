/**
 * 🎨 הגדרות מיתוג מרוכזות
 * ----------------------------------------
 * המקור היחיד הוא branding.config.json בשורש הפרויקט.
 * הקובץ הזה רק עוטף אותו לשימוש נוח בקוד וגם נצרך ע"י vite.config.ts
 * בזמן build כדי להזריק את הערכים ל-index.html ול-PWA manifest.
 */
import raw from "../../branding.config.json";

export const branding = {
  name: raw.name,
  fullName: raw.fullName,
  shortName: raw.shortName,
  authorName: raw.authorName,
  themeColor: raw.themeColor,
  backgroundColor: raw.backgroundColor,
  icons: {
    primary: raw.icons.primary,
    festive: raw.icons.festive,
    legacy: "🧠",
  },
  copy: {
    tagline: raw.copy.tagline,
    heroSubtitle: raw.copy.heroSubtitle,
    aboutDescription: raw.copy.aboutDescription,
    lobbySubtitle: raw.copy.lobbySubtitle,
  },
  contact: {
    phone: raw.contact.phone,
  },
  storage: {
    cacheKey: raw.storage.cacheKey,
    storageKey: raw.storage.storageKey,
  },
  colors: {
    goldToken: "game-gold",
    darkGoldToken: "game-dark-gold",
    parchmentToken: "game-parchment",
  },
} as const;

export type Branding = typeof branding;

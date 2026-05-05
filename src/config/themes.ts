/**
 * ערכות צבע למיתוג. כל ערכה דורסת את ה-CSS variables של game-* ב-index.css.
 * הערכים ב-HSL בלי ה"hsl()" מסביב — בדיוק כמו ב-:root.
 */
export type ThemeTokens = {
  "--game-bg": string;
  "--game-surface": string;
  "--game-glow": string;
  "--game-gold": string;
  "--game-dark-gold": string;
  "--game-cream": string;
  "--game-parchment": string;
  "--game-border-gold": string;
};

export type BrandingTheme = {
  id: string;
  label: string;
  description: string;
  swatch: [string, string, string, string];
  tokens: ThemeTokens;
};

export const brandingThemes: BrandingTheme[] = [
  {
    id: "royal-gold",
    label: "זהב מלכותי (ברירת מחדל)",
    description: "פרגמנט חם וזהב עשיר — הסגנון הקיים.",
    swatch: ["#f5ecd9", "#e6d3a8", "#b8893d", "#8a6630"],
    tokens: {
      "--game-bg": "38 50% 94%",
      "--game-surface": "38 40% 88%",
      "--game-glow": "35 60% 50%",
      "--game-gold": "35 55% 53%",
      "--game-dark-gold": "30 40% 43%",
      "--game-cream": "40 60% 97%",
      "--game-parchment": "38 45% 92%",
      "--game-border-gold": "35 45% 56%",
    },
  },
  {
    id: "rose-blush",
    label: "ורוד פודרה",
    description: "ורוד עדין עם נגיעות זהב ורד — נשי ועדין.",
    swatch: ["#fdeef0", "#f6cfd6", "#c97a8a", "#7d3f4c"],
    tokens: {
      "--game-bg": "350 60% 96%",
      "--game-surface": "350 50% 90%",
      "--game-glow": "340 55% 55%",
      "--game-gold": "345 45% 58%",
      "--game-dark-gold": "345 35% 38%",
      "--game-cream": "350 70% 98%",
      "--game-parchment": "350 55% 94%",
      "--game-border-gold": "345 40% 60%",
    },
  },
  {
    id: "midnight-emerald",
    label: "אמרלד לילה",
    description: "ירוק עמוק עם זהב — דרמטי וחגיגי.",
    swatch: ["#0d2a22", "#16423a", "#cfa14a", "#f0d78c"],
    tokens: {
      "--game-bg": "165 50% 12%",
      "--game-surface": "165 35% 18%",
      "--game-glow": "45 70% 60%",
      "--game-gold": "42 65% 58%",
      "--game-dark-gold": "40 55% 70%",
      "--game-cream": "45 50% 92%",
      "--game-parchment": "165 30% 22%",
      "--game-border-gold": "42 60% 55%",
    },
  },
  {
    id: "ocean-pearl",
    label: "פנינה ואוקיינוס",
    description: "תכלת רענן עם כסף — נקי ואלגנטי.",
    swatch: ["#eaf3f8", "#c2dde9", "#3e7ea1", "#1f4a66"],
    tokens: {
      "--game-bg": "200 55% 95%",
      "--game-surface": "200 45% 88%",
      "--game-glow": "205 60% 50%",
      "--game-gold": "205 50% 45%",
      "--game-dark-gold": "210 50% 30%",
      "--game-cream": "200 65% 97%",
      "--game-parchment": "200 50% 93%",
      "--game-border-gold": "205 45% 55%",
    },
  },
];

export function applyThemeTokens(target: HTMLElement, tokens: ThemeTokens) {
  for (const [k, v] of Object.entries(tokens)) {
    target.style.setProperty(k, v);
  }
}

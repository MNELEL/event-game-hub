import { useState, useEffect } from "react";

export type ThemeId = "parchment" | "dark" | "ocean" | "forest" | "sunset";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  emoji: string;
  preview: { bg: string; accent: string; text: string };
}

export const THEMES: ThemeOption[] = [
  {
    id: "parchment",
    name: "קלף עתיק",
    emoji: "📜",
    preview: { bg: "#f5ead6", accent: "#a0784a", text: "#5c3a1e" },
  },
  {
    id: "dark",
    name: "חלל כהה",
    emoji: "🌌",
    preview: { bg: "#141824", accent: "#8b5cf6", text: "#e2e8f0" },
  },
  {
    id: "ocean",
    name: "אוקיינוס",
    emoji: "🌊",
    preview: { bg: "#ebf8ff", accent: "#0284c7", text: "#0c1a2e" },
  },
  {
    id: "forest",
    name: "יער ירוק",
    emoji: "🌿",
    preview: { bg: "#f0faf0", accent: "#2d7a3a", text: "#0f2a12" },
  },
  {
    id: "sunset",
    name: "שקיעה",
    emoji: "🌅",
    preview: { bg: "#faf0ff", accent: "#9333ea", text: "#2d0f4e" },
  },
];

const STORAGE_KEY = "megabrain_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId;
      return saved && THEMES.find(t => t.id === saved) ? saved : "parchment";
    } catch {
      return "parchment";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = (id: ThemeId) => setThemeState(id);

  return { theme, setTheme, themes: THEMES, currentTheme: THEMES.find(t => t.id === theme)! };
}

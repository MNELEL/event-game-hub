import { useEffect } from "react";
import { brandingThemes, applyThemeTokens } from "@/config/themes";

const STORAGE_KEY = "branding_theme_id";

export function loadActiveThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || brandingThemes[0].id;
  } catch {
    return brandingThemes[0].id;
  }
}

export function setActiveTheme(id: string) {
  const theme = brandingThemes.find((t) => t.id === id) ?? brandingThemes[0];
  applyThemeTokens(document.documentElement, theme.tokens);
  try { localStorage.setItem(STORAGE_KEY, theme.id); } catch {}
}

export function useThemeLoader() {
  useEffect(() => {
    setActiveTheme(loadActiveThemeId());
  }, []);
}

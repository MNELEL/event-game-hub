import { useState, useEffect, useCallback } from "react";

export type ThemeId = "parchment" | "dark" | "ocean" | "forest" | "sunset" | string;

export interface ThemeOption {
  id: ThemeId;
  name: string;
  emoji: string;
  preview: { bg: string; accent: string; text: string };
  isCustom?: boolean;
}

export interface CustomTheme {
  id: string;
  name: string;
  emoji: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  gameGold: string;
  gameDarkGold: string;
  gameBorderGold: string;
  gradientStart: string;
  gradientEnd: string;
  bgImage?: string;
  bgImageOpacity: number;
  playerAvatars: string[];
  confettiColors: string[];
  preview: { bg: string; accent: string; text: string };
}

export const PRESET_CONFETTI: Record<string, string[]> = {
  parchment: ["#c9a96e", "#e8d5b7", "#8b6914", "#f5e6c8", "#a0784a"],
  dark:      ["#8b5cf6", "#6d28d9", "#a78bfa", "#fbbf24", "#60a5fa"],
  ocean:     ["#0284c7", "#06b6d4", "#38bdf8", "#0ea5e9", "#7dd3fc"],
  forest:    ["#2d7a3a", "#4ade80", "#86efac", "#fbbf24", "#a3e635"],
  sunset:    ["#9333ea", "#ec4899", "#f97316", "#fbbf24", "#e879f9"],
  medical:   ["#00d4ff", "#00a8cc", "#ffffff", "#38bdf8", "#7dd3fc"],
};

export const DEFAULT_AVATARS = ["🧠","🦁","🦊","🐼","🦄","🐸","🦋","🐉","🌟","⚡","🔥","💎","🎯","🚀","🎭","👑"];

export const BUILT_IN_THEMES: ThemeOption[] = [
  { id: "parchment", name: "קלף עתיק",  emoji: "📜", preview: { bg: "#f5ead6", accent: "#a0784a", text: "#5c3a1e" } },
  { id: "dark",      name: "חלל כהה",   emoji: "🌌", preview: { bg: "#141824", accent: "#8b5cf6", text: "#e2e8f0" } },
  { id: "ocean",     name: "אוקיינוס",  emoji: "🌊", preview: { bg: "#ebf8ff", accent: "#0284c7", text: "#0c1a2e" } },
  { id: "forest",    name: "יער ירוק",  emoji: "🌿", preview: { bg: "#f0faf0", accent: "#2d7a3a", text: "#0f2a12" } },
  { id: "sunset",    name: "שקיעה",     emoji: "🌅", preview: { bg: "#faf0ff", accent: "#9333ea", text: "#2d0f4e" } },
  { id: "medical",   name: "רפואי",      emoji: "🏥", preview: { bg: "#0d1520", accent: "#00d4ff", text: "#b0e8f5" } },
];

export const THEMES = BUILT_IN_THEMES;

const STORAGE_KEY = "megabrain_theme";
const CUSTOM_KEY  = "megabrain_custom_themes";
const AVATARS_KEY = "megabrain_player_avatars";

function loadCustomThemes(): CustomTheme[] {
  try { const r = localStorage.getItem(CUSTOM_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveCustomThemes(t: CustomTheme[]) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(t)); } catch {}
}

function applyCustomThemeToDom(t: CustomTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.id);
  const vars: Record<string, string> = {
    "--background": t.background, "--foreground": t.foreground,
    "--card": t.background, "--card-foreground": t.foreground,
    "--popover": t.background, "--popover-foreground": t.foreground,
    "--primary": t.primary, "--primary-foreground": "0 0% 100%",
    "--secondary": t.secondary, "--secondary-foreground": "0 0% 100%",
    "--muted": t.background, "--muted-foreground": t.foreground,
    "--border": t.gameBorderGold, "--input": t.gameBorderGold, "--ring": t.primary,
    "--game-bg": t.background, "--game-surface": t.background,
    "--game-glow": t.gameGold, "--game-gold": t.gameGold,
    "--game-dark-gold": t.gameDarkGold, "--game-correct": "145 65% 42%",
    "--game-wrong": "0 70% 50%", "--game-cream": t.background,
    "--game-parchment": t.background, "--game-border-gold": t.gameBorderGold,
    "--theme-gradient-start": t.gradientStart, "--theme-gradient-end": t.gradientEnd,
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  const existing = document.getElementById("__theme_bg_overlay__");
  if (existing) existing.remove();
  if (t.bgImage) {
    const el = document.createElement("div");
    el.id = "__theme_bg_overlay__";
    el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url(${t.bgImage});background-size:cover;background-position:center;opacity:${t.bgImageOpacity};`;
    document.body.prepend(el);
  }
}

function clearCustomThemeDom() {
  document.documentElement.style.cssText = "";
  const el = document.getElementById("__theme_bg_overlay__");
  if (el) el.remove();
}

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "parchment"; } catch { return "parchment"; }
  });
  const [customThemes, setCustomThemesState] = useState<CustomTheme[]>(loadCustomThemes);
  const [playerAvatars, setPlayerAvatarsState] = useState<string[]>(() => {
    try { const r = localStorage.getItem(AVATARS_KEY); return r ? JSON.parse(r) : DEFAULT_AVATARS; } catch { return DEFAULT_AVATARS; }
  });

  const allThemes: ThemeOption[] = [
    ...BUILT_IN_THEMES,
    ...customThemes.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, preview: t.preview, isCustom: true as const })),
  ];
  const isBuiltIn = BUILT_IN_THEMES.some(t => t.id === themeId);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, themeId); } catch {}
    if (isBuiltIn) { clearCustomThemeDom(); document.documentElement.setAttribute("data-theme", themeId); }
    else { const c = customThemes.find(t => t.id === themeId); if (c) applyCustomThemeToDom(c); }
  }, [themeId, customThemes, isBuiltIn]);

  const setTheme = useCallback((id: string) => setThemeId(id), []);

  const saveCustomTheme = useCallback((theme: CustomTheme) => {
    setCustomThemesState(prev => {
      const updated = prev.some(t => t.id === theme.id) ? prev.map(t => t.id === theme.id ? theme : t) : [...prev, theme];
      saveCustomThemes(updated); return updated;
    });
    setThemeId(theme.id);
  }, []);

  const deleteCustomTheme = useCallback((id: string) => {
    setCustomThemesState(prev => { const u = prev.filter(t => t.id !== id); saveCustomThemes(u); return u; });
    if (themeId === id) setThemeId("parchment");
  }, [themeId]);

  const updatePlayerAvatars = useCallback((avatars: string[]) => {
    setPlayerAvatarsState(avatars);
    try { localStorage.setItem(AVATARS_KEY, JSON.stringify(avatars)); } catch {}
  }, []);

  const currentTheme = allThemes.find(t => t.id === themeId) || allThemes[0];
  const currentCustomTheme = customThemes.find(t => t.id === themeId);
  const confettiColors = currentCustomTheme?.confettiColors || PRESET_CONFETTI[themeId] || PRESET_CONFETTI.parchment;

  return {
    theme: themeId, setTheme, themes: allThemes,
    builtInThemes: BUILT_IN_THEMES, customThemes, currentTheme, currentCustomTheme,
    saveCustomTheme, deleteCustomTheme, playerAvatars, updatePlayerAvatars, confettiColors,
  };
}

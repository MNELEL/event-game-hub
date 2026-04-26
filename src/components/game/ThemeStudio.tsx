import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, CustomTheme, BUILT_IN_THEMES, DEFAULT_AVATARS } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Palette, X, Plus, Trash2, Check, Upload, Image,
  Smile, Sparkles, Save, RotateCcw, ChevronLeft, ChevronRight,
  Paintbrush, Star,
} from "lucide-react";

const EMOJI_POOL = ["🧠","🦁","🦊","🐼","🦄","🐸","🦋","🐉","🌟","⚡","🔥","💎","🎯","🚀","🎭","👑",
  "🌈","🎪","🎨","🎵","🏆","🎲","🌙","☀️","🌊","🌿","🦅","🐬","🌺","🍀","🦚","🦜"];

const CONFETTI_PRESETS = [
  { name: "זהב",    colors: ["#f59e0b","#fbbf24","#fcd34d","#d97706","#92400e"] },
  { name: "קשת",   colors: ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6"] },
  { name: "סגול",  colors: ["#8b5cf6","#a78bfa","#c4b5fd","#7c3aed","#4c1d95"] },
  { name: "ים",    colors: ["#06b6d4","#0ea5e9","#38bdf8","#0284c7","#0c4a6e"] },
  { name: "ורוד",  colors: ["#ec4899","#f472b6","#f9a8d4","#db2777","#9d174d"] },
];

function hslToHex(hsl: string): string {
  try {
    const parts = hsl.trim().split(/[\s,]+/).map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return "#888888";
    const [h, s, l] = [parts[0], parts[1] / 100, parts[2] / 100];
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch { return "#888888"; }
}

function hexToHsl(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return "0 0% 50%"; }
}

const newCustomTheme = (): CustomTheme => ({
  id: `custom_${Date.now()}`,
  name: "ערכה חדשה",
  emoji: "✨",
  background: "38 45% 96%",
  foreground: "30 40% 12%",
  primary: "250 70% 55%",
  secondary: "45 90% 55%",
  gameGold: "35 55% 53%",
  gameDarkGold: "30 40% 38%",
  gameBorderGold: "35 45% 56%",
  gradientStart: "hsl(40,55%,96%)",
  gradientEnd: "hsl(35,45%,88%)",
  bgImage: undefined,
  bgImageOpacity: 0.15,
  playerAvatars: [...DEFAULT_AVATARS],
  confettiColors: ["#f59e0b","#fbbf24","#fcd34d","#d97706","#92400e"],
  preview: { bg: "#f5ead6", accent: "#a0784a", text: "#5c3a1e" },
});

type Tab = "themes" | "custom" | "avatars" | "confetti";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ThemeStudio({ open, onClose }: Props) {
  const { theme, setTheme, builtInThemes, customThemes, saveCustomTheme, deleteCustomTheme, playerAvatars, updatePlayerAvatars } = useTheme();
  const [tab, setTab] = useState<Tab>("themes");
  const [editing, setEditing] = useState<CustomTheme | null>(null);
  const [avatarTab, setAvatarTab] = useState<"emoji" | "image">("emoji");
  const [avatarPage, setAvatarPage] = useState(0);
  const bgImageRef = useRef<HTMLInputElement>(null);
  const avatarImgRef = useRef<HTMLInputElement>(null);
  const AVATARS_PER_PAGE = 8;

  const startNew = () => { setEditing(newCustomTheme()); setTab("custom"); };
  const startEdit = (t: CustomTheme) => { setEditing({ ...t }); setTab("custom"); };

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = ev => setEditing(prev => prev ? { ...prev, bgImage: ev.target?.result as string } : prev);
    reader.readAsDataURL(file);
  };

  const handleAvatarImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      if (editing) setEditing(prev => prev ? { ...prev, playerAvatars: [...prev.playerAvatars, src] } : prev);
      else updatePlayerAvatars([...playerAvatars, src]);
    };
    reader.readAsDataURL(file);
  };

  const toggleAvatar = (av: string) => {
    if (editing) {
      setEditing(prev => {
        if (!prev) return prev;
        const has = prev.playerAvatars.includes(av);
        return { ...prev, playerAvatars: has ? prev.playerAvatars.filter(a => a !== av) : [...prev.playerAvatars, av] };
      });
    } else {
      const has = playerAvatars.includes(av);
      updatePlayerAvatars(has ? playerAvatars.filter(a => a !== av) : [...playerAvatars, av]);
    }
  };

  const currentAvatars = editing ? editing.playerAvatars : playerAvatars;

  const saveEditing = () => {
    if (!editing) return;
    // Update preview from current colors
    const updated: CustomTheme = {
      ...editing,
      gradientStart: `hsl(${editing.background.split(" ")[0]},${editing.background.split(" ")[1]},${parseInt(editing.background.split(" ")[2]) + 2}%)`,
      gradientEnd: `hsl(${editing.background.split(" ")[0]},${parseInt(editing.background.split(" ")[1]) - 5}%,${parseInt(editing.background.split(" ")[2]) - 5}%)`,
      preview: {
        bg: hslToHex(editing.background),
        accent: hslToHex(editing.gameGold),
        text: hslToHex(editing.foreground),
      },
    };
    saveCustomTheme(updated);
    setEditing(null);
    setTab("themes");
  };

  const pagedEmoji = EMOJI_POOL.slice(avatarPage * AVATARS_PER_PAGE, (avatarPage + 1) * AVATARS_PER_PAGE);
  const maxPage = Math.ceil(EMOJI_POOL.length / AVATARS_PER_PAGE) - 1;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <motion.div
          className="relative bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold">סטודיו עיצוב</h2>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30 shrink-0 px-2 pt-2 gap-1">
            {([
              { id: "themes", label: "ערכות", icon: Palette },
              { id: "custom", label: "עיצוב", icon: Paintbrush },
              { id: "avatars", label: "אווטרים", icon: Smile },
              { id: "confetti", label: "קונפטי", icon: Sparkles },
            ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); if (id !== "custom") setEditing(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 -mb-px transition-all ${
                  tab === id ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* ── THEMES TAB ── */}
            {tab === "themes" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">בחרו ערכת נושא לכל האפליקציה</p>

                {/* Built-in */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Star className="w-3 h-3"/>ערכות מובנות</p>
                  <div className="grid grid-cols-5 gap-2">
                    {builtInThemes.map(t => (
                      <motion.button
                        key={t.id} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        onClick={() => setTheme(t.id)}
                        className="relative flex flex-col items-center gap-1"
                        title={t.name}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl shadow-sm transition-all"
                          style={{
                            backgroundColor: t.preview.bg,
                            borderColor: theme === t.id ? t.preview.accent : "transparent",
                            boxShadow: theme === t.id ? `0 0 0 3px ${t.preview.accent}` : undefined,
                          }}
                        >
                          {t.emoji}
                          {theme === t.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-primary">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{t.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom */}
                {customThemes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Paintbrush className="w-3 h-3"/>ערכות מותאמות אישית</p>
                    <div className="grid grid-cols-1 gap-2">
                      {customThemes.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                          <button
                            onClick={() => setTheme(t.id)}
                            className="flex items-center gap-3 flex-1 text-right"
                          >
                            <div
                              className="w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shrink-0"
                              style={{ backgroundColor: t.preview.bg, borderColor: theme === t.id ? t.preview.accent : "transparent" }}
                            >
                              {t.emoji}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{t.name}</p>
                              <div className="flex gap-1 mt-1">
                                {[t.preview.bg, t.preview.accent, t.preview.text].map((c, i) => (
                                  <span key={i} className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: c }}/>
                                ))}
                              </div>
                            </div>
                            {theme === t.id && <Check className="w-4 h-4 text-primary shrink-0"/>}
                          </button>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(t)}>
                              <Paintbrush className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCustomTheme(t.id)}>
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={startNew} className="w-full gap-2 border-dashed">
                  <Plus className="w-4 h-4"/> צור ערכה חדשה
                </Button>
              </div>
            )}

            {/* ── CUSTOM EDITOR TAB ── */}
            {tab === "custom" && (
              <div className="space-y-5">
                {!editing ? (
                  <div className="text-center py-8">
                    <Paintbrush className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3"/>
                    <p className="text-sm text-muted-foreground mb-4">בחר ערכה לעריכה או צור חדשה</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {customThemes.map(t => (
                        <Button key={t.id} variant="outline" size="sm" onClick={() => startEdit(t)} className="gap-2">
                          {t.emoji} {t.name}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={startNew} className="gap-2 border-dashed">
                        <Plus className="w-3.5 h-3.5"/> חדש
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Name & emoji */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">שם הערכה</Label>
                        <Input value={editing.name} onChange={e => setEditing(p => p ? {...p, name: e.target.value} : p)} className="h-9"/>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">אמוג׳י</Label>
                        <Input value={editing.emoji} onChange={e => setEditing(p => p ? {...p, emoji: e.target.value} : p)} className="h-9 w-16 text-center text-lg"/>
                      </div>
                    </div>

                    {/* Color pickers */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground">צבעים</p>
                      {[
                        { key: "background", label: "רקע" },
                        { key: "foreground", label: "טקסט" },
                        { key: "primary", label: "ראשי" },
                        { key: "secondary", label: "משני" },
                        { key: "gameGold", label: "זהב משחק" },
                        { key: "gameDarkGold", label: "זהב כהה" },
                        { key: "gameBorderGold", label: "גבול" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="text-xs text-muted-foreground w-20 shrink-0">{label}</label>
                          <input
                            type="color"
                            value={hslToHex((editing as any)[key])}
                            onChange={e => setEditing(p => p ? { ...p, [key]: hexToHsl(e.target.value) } : p)}
                            className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-transparent p-0.5"
                          />
                          <span className="text-xs text-muted-foreground font-mono truncate">{(editing as any)[key]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Background image */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">תמונת רקע</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => bgImageRef.current?.click()} className="gap-2 flex-1">
                          <Upload className="w-3.5 h-3.5"/> העלה תמונה
                        </Button>
                        {editing.bgImage && (
                          <Button variant="outline" size="sm" onClick={() => setEditing(p => p ? {...p, bgImage: undefined} : p)} className="text-destructive hover:text-destructive">
                            <X className="w-3.5 h-3.5"/>
                          </Button>
                        )}
                        <input ref={bgImageRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage}/>
                      </div>
                      {editing.bgImage && (
                        <div className="space-y-1">
                          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border">
                            <img src={editing.bgImage} alt="bg" className="w-full h-full object-cover"/>
                          </div>
                          <div className="flex items-center gap-3">
                            <Label className="text-xs shrink-0">שקיפות: {Math.round(editing.bgImageOpacity * 100)}%</Label>
                            <Slider
                              value={[editing.bgImageOpacity * 100]}
                              onValueChange={([v]) => setEditing(p => p ? {...p, bgImageOpacity: v/100} : p)}
                              min={5} max={60} step={5} className="flex-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div
                      className="rounded-2xl p-4 border-2 text-center"
                      style={{
                        backgroundColor: hslToHex(editing.background),
                        borderColor: hslToHex(editing.gameBorderGold),
                        color: hslToHex(editing.foreground),
                        backgroundImage: editing.bgImage ? `url(${editing.bgImage})` : undefined,
                        backgroundSize: "cover",
                      }}
                    >
                      <p className="font-bold text-lg" style={{ color: hslToHex(editing.gameGold) }}>🧠 החגיגה של חיוש</p>
                      <p className="text-xs mt-1 opacity-70">תצוגה מקדימה</p>
                      <div className="flex gap-2 justify-center mt-2">
                        <span className="px-3 py-1 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: hslToHex(editing.primary) }}>כפתור ראשי</span>
                        <span className="px-3 py-1 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: hslToHex(editing.secondary) }}>כפתור משני</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} className="flex-1 gap-2">
                        <Save className="w-4 h-4"/> שמור ערכה
                      </Button>
                      <Button variant="outline" onClick={() => { setEditing(null); setTab("themes"); }}>
                        <X className="w-4 h-4"/>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── AVATARS TAB ── */}
            {tab === "avatars" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">בחרו אמוג׳י ותמונות שיוצגו לצד שמות השחקנים</p>

                <div className="flex gap-2">
                  {(["emoji", "image"] as const).map(t => (
                    <button key={t} onClick={() => setAvatarTab(t)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        avatarTab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "emoji" ? <><Smile className="w-3.5 h-3.5"/>אמוג׳י</> : <><Image className="w-3.5 h-3.5"/>תמונות</>}
                    </button>
                  ))}
                </div>

                {avatarTab === "emoji" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-8 gap-2">
                      {pagedEmoji.map(av => (
                        <motion.button
                          key={av} whileTap={{ scale: 0.85 }}
                          onClick={() => toggleAvatar(av)}
                          className={`h-10 w-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                            currentAvatars.includes(av) ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-muted-foreground"
                          }`}
                        >
                          {av}
                          {currentAvatars.includes(av) && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" strokeWidth={3}/>
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" disabled={avatarPage === 0} onClick={() => setAvatarPage(p => p - 1)}>
                        <ChevronRight className="w-4 h-4"/>
                      </Button>
                      <span className="text-xs text-muted-foreground">{avatarPage + 1} / {maxPage + 1}</span>
                      <Button variant="ghost" size="sm" disabled={avatarPage === maxPage} onClick={() => setAvatarPage(p => p + 1)}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                )}

                {avatarTab === "image" && (
                  <div className="space-y-3">
                    <Button variant="outline" onClick={() => avatarImgRef.current?.click()} className="w-full gap-2 border-dashed">
                      <Upload className="w-4 h-4"/> העלה תמונת אווטר
                    </Button>
                    <input ref={avatarImgRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarImage}/>
                    <div className="grid grid-cols-5 gap-2">
                      {currentAvatars.filter(a => a.startsWith("data:")).map((av, i) => (
                        <div key={i} className="relative group">
                          <img src={av} alt="" className="w-12 h-12 rounded-xl object-cover border border-border"/>
                          <button
                            onClick={() => toggleAvatar(av)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="w-2.5 h-2.5"/>
                          </button>
                        </div>
                      ))}
                      {currentAvatars.filter(a => a.startsWith("data:")).length === 0 && (
                        <p className="col-span-5 text-xs text-muted-foreground text-center py-4">אין תמונות עדיין</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{currentAvatars.length} פריטים נבחרו</span>
                  <Button variant="ghost" size="sm" onClick={() => updatePlayerAvatars([...DEFAULT_AVATARS])} className="gap-1 text-xs">
                    <RotateCcw className="w-3 h-3"/> איפוס
                  </Button>
                </div>
              </div>
            )}

            {/* ── CONFETTI TAB ── */}
            {tab === "confetti" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">בחרו את צבעי הקונפטי לחגיגות ניצחון</p>
                <div className="space-y-3">
                  {CONFETTI_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        if (editing) setEditing(p => p ? {...p, confettiColors: preset.colors} : p);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex gap-1">
                        {preset.colors.map((c, i) => (
                          <span key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }}/>
                        ))}
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">💡 צבעי הקונפטי מוגדרים בתוך ערכה מותאמת אישית</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

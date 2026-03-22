import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, Zap, Palette, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { ThemePicker } from "./ThemePicker";

export function SoundControlPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"sound" | "theme">("sound");
  const [muted, setMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(50);
  const [musicVol, setMusicVol] = useState(30);
  const [sfxVol, setSfxVol] = useState(50);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    SoundEffects.setMasterVolume(next ? 0 : masterVol / 100);
    SoundEffects.toggleMusic(!next);
    SoundEffects.toggleSfx(!next);
  };

  const handleMaster = (v: number[]) => {
    const val = v[0];
    setMasterVol(val);
    SoundEffects.setMasterVolume(val / 100);
    if (val === 0 && !muted) setMuted(true);
    if (val > 0 && muted) setMuted(false);
  };

  const sliderClass =
    "[&_[role=slider]]:bg-game-gold [&_[role=slider]]:border-game-dark-gold [&_[data-orientation=horizontal]>.bg-primary]:bg-game-gold";

  return (
    <div className="relative">
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-game-dark-gold/50 hover:text-game-dark-gold w-8 h-8"
          title={muted ? "בטל השתקה" : "השתק"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="text-game-dark-gold/40 hover:text-game-dark-gold w-8 h-8"
          title="הגדרות"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.93 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 mt-2 parchment-card parchment-border-double rounded-2xl p-4 w-64 z-[100] shadow-2xl"
          >
            {/* Tab selector */}
            <div className="flex gap-1 mb-4 bg-black/5 rounded-xl p-1">
              <button
                onClick={() => setTab("sound")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === "sound"
                    ? "bg-white shadow text-game-dark-gold"
                    : "text-game-dark-gold/50 hover:text-game-dark-gold/70"
                }`}
              >
                <Volume2 className="w-3 h-3" /> סאונד
              </button>
              <button
                onClick={() => setTab("theme")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === "theme"
                    ? "bg-white shadow text-game-dark-gold"
                    : "text-game-dark-gold/50 hover:text-game-dark-gold/70"
                }`}
              >
                <Palette className="w-3 h-3" /> עיצוב
              </button>
            </div>

            {tab === "sound" && (
              <div className="space-y-4">
                {/* Master */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-game-dark-gold/70 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> עוצמה ראשית
                    </span>
                    <span className="text-xs text-game-dark-gold/50 font-mono">{masterVol}%</span>
                  </div>
                  <Slider value={[masterVol]} onValueChange={handleMaster} max={100} step={5} className={sliderClass} />
                </div>

                {/* Music toggle + volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-game-dark-gold/70 flex items-center gap-1 cursor-pointer">
                      <Music className="w-3 h-3" /> מוזיקת רקע
                    </Label>
                    <Switch
                      checked={musicEnabled}
                      onCheckedChange={(v) => {
                        setMusicEnabled(v);
                        SoundEffects.toggleMusic(v);
                      }}
                      className="scale-75"
                    />
                  </div>
                  {musicEnabled && (
                    <Slider
                      value={[musicVol]}
                      onValueChange={(v) => { setMusicVol(v[0]); SoundEffects.setMusicVolume(v[0] / 100); }}
                      max={100} step={5}
                      className={sliderClass}
                      disabled={!musicEnabled}
                    />
                  )}
                </div>

                {/* SFX toggle + volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-game-dark-gold/70 flex items-center gap-1 cursor-pointer">
                      <Zap className="w-3 h-3" /> אפקטי צליל
                    </Label>
                    <Switch
                      checked={sfxEnabled}
                      onCheckedChange={(v) => {
                        setSfxEnabled(v);
                        SoundEffects.toggleSfx(v);
                      }}
                      className="scale-75"
                    />
                  </div>
                  {sfxEnabled && (
                    <Slider
                      value={[sfxVol]}
                      onValueChange={(v) => { setSfxVol(v[0]); SoundEffects.setSfxVolume(v[0] / 100); }}
                      max={100} step={5}
                      className={sliderClass}
                      disabled={!sfxEnabled}
                    />
                  )}
                </div>

                {/* Test sounds */}
                <div className="border-t border-game-border-gold/30 pt-3">
                  <p className="text-xs text-game-dark-gold/50 mb-2 text-center">בדיקת צלילים</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "✅ נכון", fn: () => SoundEffects.correct() },
                      { label: "❌ שגוי", fn: () => SoundEffects.wrong() },
                      { label: "🏆 ניצחון", fn: () => SoundEffects.victory() },
                      { label: "⏰ זמן", fn: () => SoundEffects.timeUp() },
                      { label: "🎯 שאלה", fn: () => SoundEffects.questionReveal() },
                      { label: "👋 הצטרף", fn: () => SoundEffects.playerJoin() },
                    ].map(({ label, fn }) => (
                      <button
                        key={label}
                        onClick={fn}
                        className="text-xs py-1.5 px-2 rounded-lg bg-game-border-gold/20 hover:bg-game-border-gold/40 text-game-dark-gold font-medium transition-all active:scale-95"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "theme" && <ThemePicker />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

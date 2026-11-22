import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SoundEffects } from "@/hooks/useSoundEffects";

export function SoundControlPanel() {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(50);
  const [musicVol, setMusicVol] = useState(30);
  const [sfxVol, setSfxVol] = useState(50);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    SoundEffects.setMasterVolume(next ? 0 : masterVol / 100);
    if (next) {
      SoundEffects.toggleMusic(false);
    } else {
      SoundEffects.toggleMusic(true);
    }
  };

  const handleMaster = (v: number[]) => {
    const val = v[0];
    setMasterVol(val);
    SoundEffects.setMasterVolume(val / 100);
    if (val === 0 && !muted) setMuted(true);
    if (val > 0 && muted) setMuted(false);
  };

  const handleMusic = (v: number[]) => {
    setMusicVol(v[0]);
    SoundEffects.setMusicVolume(v[0] / 100);
  };

  const handleSfx = (v: number[]) => {
    setSfxVol(v[0]);
    SoundEffects.setSfxVolume(v[0] / 100);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        onDoubleClick={() => setOpen(!open)}
        className="text-game-dark-gold/50 hover:text-game-dark-gold relative"
        title="לחץ להשתקה, לחיצה כפולה לבקרת ווליום"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* Expand button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-game-dark-gold/40 hover:text-game-dark-gold text-xs px-1 h-6"
      >
        {open ? "▲" : "▼"}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-full left-0 mt-2 parchment-card parchment-border-double rounded-xl p-4 w-56 z-[100] shadow-xl"
          >
            <h4 className="font-serif text-game-dark-gold text-sm font-bold mb-3 text-center">🔊 בקרת סאונד</h4>

            <div className="space-y-3">
              {/* Master */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-game-dark-gold/70 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> ראשי
                  </span>
                  <span className="text-xs text-game-dark-gold/50 font-mono">{masterVol}%</span>
                </div>
                <Slider
                  value={[masterVol]}
                  onValueChange={handleMaster}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-game-gold [&_[role=slider]]:border-game-dark-gold [&_[data-orientation=horizontal]>.bg-primary]:bg-game-gold"
                />
              </div>

              {/* Music */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-game-dark-gold/70 flex items-center gap-1">
                    <Music className="w-3 h-3" /> מוזיקה
                  </span>
                  <span className="text-xs text-game-dark-gold/50 font-mono">{musicVol}%</span>
                </div>
                <Slider
                  value={[musicVol]}
                  onValueChange={handleMusic}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-game-gold [&_[role=slider]]:border-game-dark-gold [&_[data-orientation=horizontal]>.bg-primary]:bg-game-gold"
                />
              </div>

              {/* SFX */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-game-dark-gold/70 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> אפקטים
                  </span>
                  <span className="text-xs text-game-dark-gold/50 font-mono">{sfxVol}%</span>
                </div>
                <Slider
                  value={[sfxVol]}
                  onValueChange={handleSfx}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-game-gold [&_[role=slider]]:border-game-dark-gold [&_[data-orientation=horizontal]>.bg-primary]:bg-game-gold"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
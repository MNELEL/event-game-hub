import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, VolumeX, Maximize2, X, PlayCircle, RotateCcw,
  Image as ImageIcon, Video, Type, ToggleLeft, Check, X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SoundEffects } from "@/hooks/useSoundEffects";
import {
  loadDemoQuestions, DEMO_UPDATED_EVENT,
  type DemoQType, type DemoQuestion,
} from "@/data/landingDemo";

const ICONS: Record<DemoQType, any> = {
  text: Type,
  image: ImageIcon,
  video: Video,
  boolean: ToggleLeft,
};

const ORDER: DemoQType[] = ["text", "image", "video", "boolean"];

interface DemoBodyProps {
  fullscreen?: boolean;
  onOpenFullscreen?: () => void;
}

function DemoBody({ fullscreen, onOpenFullscreen }: DemoBodyProps) {
  const [questions, setQuestions] = useState<DemoQuestion[]>(() => loadDemoQuestions());
  const [type, setType] = useState<DemoQType>("text");
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [phase, setPhase] = useState<"idle" | "playing" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions.find((qq) => qq.qid === type) || questions[0];

  // Listen to live edits
  useEffect(() => {
    const reload = () => setQuestions(loadDemoQuestions());
    window.addEventListener(DEMO_UPDATED_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(DEMO_UPDATED_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Apply volume to SFX system whenever changed
  useEffect(() => {
    const v = muted ? 0 : volume / 100;
    SoundEffects.setMasterVolume(v);
    SoundEffects.setSfxVolume(1);
  }, [volume, muted]);

  // Cleanup
  useEffect(() => () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    SoundEffects.stopHourglass();
  }, []);

  const unlockAudio = () => {
    if (!audioUnlocked) {
      try {
        // Force resume — playing a silent click also unlocks AudioContext
        SoundEffects.click();
        setAudioUnlocked(true);
      } catch {}
    }
  };

  const startQuestion = () => {
    unlockAudio();
    setSelected(null);
    setShowResult(false);
    setPhase("playing");
    try {
      SoundEffects.questionReveal();
      setTimeout(() => SoundEffects.startHourglass(8), 600);
    } catch {}
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    endTimerRef.current = setTimeout(() => {
      // Auto end if no selection
      setPhase((p) => (p === "playing" ? "ended" : p));
      try { SoundEffects.stopHourglass(); SoundEffects.timeUp(); } catch {}
    }, 8500);
  };

  const handleSelect = (i: number) => {
    if (phase !== "playing" || selected !== null) return;
    unlockAudio();
    setSelected(i);
    try { SoundEffects.answerSelect(); } catch {}
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    setTimeout(() => {
      try {
        SoundEffects.stopHourglass();
        if (i === q.correct) SoundEffects.correct();
        else SoundEffects.wrong();
      } catch {}
      setShowResult(true);
      setPhase("ended");
    }, 350);
  };

  const reset = () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    SoundEffects.stopHourglass();
    setSelected(null);
    setShowResult(false);
    setPhase("idle");
  };

  const switchType = (t: QType) => {
    reset();
    setType(t);
  };

  const phoneFrameClass = fullscreen
    ? "w-full max-w-[380px] h-[700px] mx-auto"
    : "w-full max-w-[300px] h-[560px] mx-auto";

  return (
    <div className="w-full">
      {/* Type tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {ORDER.map((t) => {
          const Icon = QUESTIONS[t].icon;
          const active = t === type;
          return (
            <button
              key={t}
              onClick={() => switchType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                active
                  ? "bg-game-gold text-game-dark-gold border-game-dark-gold shadow"
                  : "bg-game-parchment/60 text-game-dark-gold/70 border-game-border-gold/40 hover:border-game-border-gold"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {QUESTIONS[t].label}
            </button>
          );
        })}
      </div>

      {/* Phone frame */}
      <div className={`relative ${phoneFrameClass} rounded-[2.5rem] border-[10px] border-game-dark-gold/80 bg-gradient-to-b from-game-parchment to-game-parchment/80 shadow-2xl overflow-hidden flex flex-col`}>
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-game-dark-gold/80 rounded-b-2xl z-10" />

        <div className="flex-1 flex flex-col p-4 pt-7 overflow-y-auto">
          {phase === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="text-5xl">🎯</div>
              <h4 className="font-display text-xl text-game-dark-gold">דמו אינטראקטיבי</h4>
              <p className="text-xs text-game-dark-gold/70 px-3">
                הקליקו "התחל שאלה" כדי לחוות את חוויית האורח —
                כולל צלילים, טיימר ופידבק חי.
              </p>
              <Button variant="game" size="sm" onClick={startQuestion} className="gap-2">
                <PlayCircle className="w-4 h-4" /> התחל שאלה
              </Button>
            </div>
          )}

          {phase !== "idle" && (
            <>
              {/* Question */}
              <div className="text-center mb-3">
                <p className="text-[10px] uppercase tracking-wider text-game-dark-gold/50 mb-1">
                  שאלה · {q.label}
                </p>
                <h4 className="font-display text-base md:text-lg text-game-dark-gold leading-snug">
                  {q.q}
                </h4>
              </div>

              {/* Media */}
              {q.media && (
                <div className="mb-3 rounded-lg overflow-hidden border-2 border-game-border-gold/50 aspect-video bg-black/10">
                  {q.media.type === "image" ? (
                    <img src={q.media.src} alt={q.media.alt || ""} className="w-full h-full object-cover" />
                  ) : (
                    <video src={q.media.src} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Options */}
              <div className={`grid ${q.options.length === 2 ? "grid-cols-2" : "grid-cols-2"} gap-2 mt-auto`}>
                {q.options.map((opt, i) => {
                  const isSel = selected === i;
                  const isCorrect = i === q.correct;
                  let cls = "bg-game-parchment border-game-border-gold/60 text-game-dark-gold hover:border-game-dark-gold";
                  if (showResult) {
                    if (isCorrect) cls = "bg-green-500/20 border-green-600 text-green-900";
                    else if (isSel) cls = "bg-red-500/20 border-red-600 text-red-900";
                    else cls = "bg-game-parchment/50 border-game-border-gold/30 text-game-dark-gold/50";
                  } else if (isSel) {
                    cls = "bg-game-gold/40 border-game-dark-gold text-game-dark-gold";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={phase !== "playing" || selected !== null}
                      className={`relative px-2 py-3 rounded-xl border-2 text-xs md:text-sm font-medium transition-all text-right ${cls} disabled:cursor-not-allowed`}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span>{opt}</span>
                        {showResult && isCorrect && <Check className="w-4 h-4 text-green-700 shrink-0" />}
                        {showResult && isSel && !isCorrect && <XIcon className="w-4 h-4 text-red-700 shrink-0" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 rounded-lg p-2 text-center text-xs font-bold ${
                      selected === q.correct
                        ? "bg-green-500/20 text-green-900"
                        : "bg-red-500/20 text-red-900"
                    }`}
                  >
                    {selected === q.correct ? "🎉 נכון! +100 נקודות" : "כמעט! התשובה הנכונה מסומנת"}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 justify-center">
        {phase === "ended" && (
          <Button variant="gold" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="w-4 h-4" /> נסה סוג אחר
          </Button>
        )}
        {phase === "ended" && (
          <Button variant="game" size="sm" onClick={startQuestion} className="gap-1">
            <PlayCircle className="w-4 h-4" /> שאלה נוספת
          </Button>
        )}
        {!fullscreen && onOpenFullscreen && (
          <Button variant="outline" size="sm" onClick={onOpenFullscreen} className="gap-1">
            <Maximize2 className="w-4 h-4" /> מסך מלא
          </Button>
        )}
      </div>

      {/* Volume controls */}
      <div className="mt-4 mx-auto max-w-sm rounded-xl border-2 border-double border-game-border-gold/50 bg-game-parchment/70 backdrop-blur p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { unlockAudio(); setMuted((m) => !m); }}
            className="text-game-dark-gold hover:text-game-gold transition-colors shrink-0"
            aria-label={muted ? "הפעל קול" : "השתק"}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <Slider
            value={[muted ? 0 : volume]}
            onValueChange={(v) => { unlockAudio(); setMuted(false); setVolume(v[0]); }}
            max={100}
            step={5}
            className="flex-1 [&_[role=slider]]:bg-game-gold [&_[role=slider]]:border-game-dark-gold [&_[data-orientation=horizontal]>.bg-primary]:bg-game-gold"
          />
          <span className="text-xs text-game-dark-gold/70 font-mono w-8 text-left">
            {muted ? 0 : volume}%
          </span>
        </div>
        {!audioUnlocked && (
          <p className="mt-2 text-[10px] text-game-dark-gold/60 text-center">
            🔊 לחצו על כפתור כלשהו כדי להפעיל קול בדפדפן
          </p>
        )}
      </div>
    </div>
  );
}

export default function InteractiveQuestionDemo() {
  const [fsOpen, setFsOpen] = useState(false);

  return (
    <section id="demo" className="relative z-10 max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-game-dark-gold mb-3">
          חוו את המשחק עכשיו
        </h2>
        <p className="text-game-dark-gold/70">
          דמו אינטראקטיבי — בדיוק כמו שהאורחים יראו בטלפון שלהם.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-double border-game-border-gold/60 bg-game-parchment/40 backdrop-blur p-6 md:p-8">
        <DemoBody onOpenFullscreen={() => setFsOpen(true)} />
      </div>

      <Dialog open={fsOpen} onOpenChange={setFsOpen}>
        <DialogContent className="max-w-full w-screen h-screen p-0 border-0 bg-game-dark-gold/95 backdrop-blur overflow-y-auto rounded-none">
          <button
            onClick={() => setFsOpen(false)}
            className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-game-parchment text-game-dark-gold shadow-lg flex items-center justify-center hover:scale-110 transition"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <p className="text-center text-game-parchment/80 text-sm mb-4">
                סימולציית מסך אורח · מלא
              </p>
              <DemoBody fullscreen />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

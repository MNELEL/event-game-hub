import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player, Question } from "@/types/game";
import { Trophy, RotateCcw, Home, Sparkles, BarChart3, Zap, Target, Crown, Timer, Download, FileImage, FileText } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireConfetti } from "@/hooks/useConfetti";
import { GameStatsPanel } from "./GameStatsPanel";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  players: Player[];
  questions: Question[];
  onRestart: () => void;
  onHome: () => void;
};

type SpecialTitle = {
  emoji: string;
  title: string;
  playerName: string;
  detail: string;
  icon: React.ReactNode;
};

export function GameFinished({ players, questions, onRestart, onHome }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];
  const [showStats, setShowStats] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const categoryWinners = useMemo(() => {
    const playersWithAnswers = players.filter(p => p.answers.length > 0);
    const topScorer = sorted[0] || null;
    let fastest: Player | null = null;
    let fastestAvg = Infinity;
    playersWithAnswers.forEach(p => {
      const avg = p.answers.reduce((s, a) => s + a.time, 0) / p.answers.length;
      if (avg < fastestAvg) { fastestAvg = avg; fastest = p; }
    });
    let mostAccurate: Player | null = null;
    let bestAcc = -1;
    playersWithAnswers.forEach(p => {
      const acc = p.answers.filter(a => a.correct).length / p.answers.length;
      if (acc > bestAcc) { bestAcc = acc; mostAccurate = p; }
    });
    return { topScorer, fastest, fastestAvg, mostAccurate, bestAcc };
  }, [players, sorted]);

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#fdf6e3", scale: 2, useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `תוצאות-משחק-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("התמונה הורדה בהצלחה");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בייצוא תמונה");
    } finally { setExporting(false); }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;
      const rtl = (s: string) => s.split("").reverse().join("");

      doc.setFontSize(22);
      doc.text(rtl("תוצאות המשחק"), pageW / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(11);
      doc.text(new Date().toLocaleString("he-IL"), pageW / 2, y, { align: "center" });
      y += 12;

      doc.setFontSize(16);
      doc.text(rtl("שלושת הזוכים"), pageW - 15, y, { align: "right" });
      y += 8;
      doc.setFontSize(12);
      const cw = categoryWinners;
      const lines: string[] = [];
      if (cw.topScorer) lines.push(`אלוף הניקוד: ${cw.topScorer.name} - ${cw.topScorer.score} נקודות`);
      if (cw.fastest) lines.push(`אלוף המהירות: ${cw.fastest.name} - ${cw.fastestAvg.toFixed(1)} שניות`);
      if (cw.mostAccurate) lines.push(`אלוף הדיוק: ${cw.mostAccurate.name} - ${Math.round(cw.bestAcc * 100)}%`);
      lines.forEach(line => { doc.text(rtl(line), pageW - 15, y, { align: "right" }); y += 7; });
      y += 6;

      doc.setFontSize(16);
      doc.text(rtl("טבלת תוצאות"), pageW - 15, y, { align: "right" });
      y += 8;
      doc.setFontSize(12);
      sorted.forEach((p, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(rtl(`${i + 1}. ${p.name} - ${p.score} נקודות`), pageW - 15, y, { align: "right" });
        y += 7;
      });

      doc.save(`תוצאות-משחק-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("ה-PDF הורד בהצלחה");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בייצוא PDF");
    } finally { setExporting(false); }
  };

  useEffect(() => {
    SoundEffects.victory();
    fireConfetti();
    // Reveal special titles after leaderboard animation
    const timer = setTimeout(() => setShowTitles(true), 2500);
    // Fire confetti again for dramatic effect
    const timer2 = setTimeout(() => fireConfetti(), 1500);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, []);

  const specialTitles = useMemo(() => {
    if (players.length === 0 || questions.length === 0) return [];
    const titles: SpecialTitle[] = [];

    // Fastest player (lowest average time among those who answered)
    const playersWithAnswers = players.filter(p => p.answers.length > 0);
    if (playersWithAnswers.length > 0) {
      const fastest = playersWithAnswers.reduce((best, p) => {
        const avgTime = p.answers.reduce((s, a) => s + a.time, 0) / p.answers.length;
        const bestAvg = best.answers.reduce((s, a) => s + a.time, 0) / best.answers.length;
        return avgTime < bestAvg ? p : best;
      });
      const avgTime = (fastest.answers.reduce((s, a) => s + a.time, 0) / fastest.answers.length).toFixed(1);
      titles.push({
        emoji: "⚡",
        title: "הברק",
        playerName: fastest.name,
        detail: `זמן תגובה ממוצע: ${avgTime} שנ׳`,
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
      });
    }

    // Most accurate (highest % correct)
    if (playersWithAnswers.length > 0) {
      const mostAccurate = playersWithAnswers.reduce((best, p) => {
        const pCorrect = p.answers.filter(a => a.correct).length / p.answers.length;
        const bestCorrect = best.answers.filter(a => a.correct).length / best.answers.length;
        return pCorrect > bestCorrect ? p : best;
      });
      const accuracy = Math.round(
        (mostAccurate.answers.filter(a => a.correct).length / mostAccurate.answers.length) * 100
      );
      titles.push({
        emoji: "🎯",
        title: "הצלף",
        playerName: mostAccurate.name,
        detail: `דיוק: ${accuracy}%`,
        icon: <Target className="w-5 h-5 text-green-400" />,
      });
    }

    // Most answers submitted (participation award)
    if (playersWithAnswers.length > 1) {
      const mostActive = playersWithAnswers.reduce((best, p) =>
        p.answers.length > best.answers.length ? p : best
      );
      titles.push({
        emoji: "💪",
        title: "הלוחם",
        playerName: mostActive.name,
        detail: `ענה על ${mostActive.answers.length} מתוך ${questions.length} שאלות`,
        icon: <Crown className="w-5 h-5 text-purple-400" />,
      });
    }

    // Perfect score (if anyone got 100%)
    const perfectPlayers = playersWithAnswers.filter(
      p => p.answers.length === questions.length && p.answers.every(a => a.correct)
    );
    if (perfectPlayers.length > 0) {
      titles.push({
        emoji: "👑",
        title: "מושלם!",
        playerName: perfectPlayers.map(p => p.name).join(", "),
        detail: "ענה נכון על כל השאלות!",
        icon: <Crown className="w-5 h-5 text-game-gold" />,
      });
    }

    // Fastest single answer
    if (playersWithAnswers.length > 0) {
      let fastestTime = Infinity;
      let fastestPlayer = playersWithAnswers[0];
      playersWithAnswers.forEach(p => {
        p.answers.forEach(a => {
          if (a.correct && a.time < fastestTime) {
            fastestTime = a.time;
            fastestPlayer = p;
          }
        });
      });
      if (fastestTime < Infinity) {
        titles.push({
          emoji: "🏎️",
          title: "התשובה המהירה",
          playerName: fastestPlayer.name,
          detail: `ענה נכון תוך ${fastestTime.toFixed(1)} שנ׳`,
          icon: <Timer className="w-5 h-5 text-orange-400" />,
        });
      }
    }

    return titles;
  }, [players, questions]);

  if (showStats) {
    return (
      <div className="min-h-screen game-gradient" dir="rtl">
        <GameStatsPanel players={players} questions={questions} onClose={() => setShowStats(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-12 relative overflow-hidden">
      {/* Floating celebration particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -60, -120],
            x: [0, (Math.random() - 0.5) * 60],
            rotate: [0, 360],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          {["🎉", "🏆", "⭐", "🎊", "✨", "🥇", "🍂", "🌟"][i % 8]}
        </motion.div>
      ))}

      {/* Winner announcement */}
      <motion.div
        className="text-center mb-6 relative z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0], y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: 3 }}
        >
          <Trophy className="w-20 h-20 text-game-gold mx-auto mb-3 drop-shadow-lg" />
        </motion.div>

        <motion.h1
          className="font-serif text-4xl md:text-5xl text-game-dark-gold text-shadow-game mb-2"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🎉 כל הכבוד, הייתם אלופים!
        </motion.h1>
        <div className="w-40 mx-auto border-t-2 border-double border-game-border-gold my-3" />

      </motion.div>

      {/* Winners Podium - Top 3 */}
      {sorted.length > 0 && (() => {
        const podium = [
          { player: sorted[1], place: 2, medal: "🥈", height: "h-32", delay: 0.6, gradient: "from-slate-300/30 to-slate-500/20", textColor: "text-slate-200", order: "order-1" },
          { player: sorted[0], place: 1, medal: "🥇", height: "h-44", delay: 1.0, gradient: "from-game-gold/40 to-game-dark-gold/30", textColor: "text-game-gold", order: "order-2", isWinner: true },
          { player: sorted[2], place: 3, medal: "🥉", height: "h-24", delay: 0.3, gradient: "from-orange-400/30 to-orange-700/20", textColor: "text-orange-300", order: "order-3" },
        ].filter(p => p.player);

        return (
          <div className="w-full max-w-md mb-8 relative z-10">
            <div className={`flex items-end justify-center gap-2 ${podium.length < 3 ? "justify-center" : ""}`}>
              {podium.map((p) => (
                <motion.div
                  key={p.place}
                  className={`flex-1 max-w-[33%] flex flex-col items-center ${p.order}`}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: p.delay, type: "spring", stiffness: 180, damping: 14 }}
                >
                  {/* Crown for winner */}
                  {p.isWinner && (
                    <motion.div
                      className="text-4xl mb-1"
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      👑
                    </motion.div>
                  )}

                  {/* Medal + name card */}
                  <motion.div
                    className="text-center mb-2 px-1"
                    animate={p.isWinner ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    <div className="text-3xl md:text-4xl mb-1">{p.medal}</div>
                    <div className={`font-serif font-bold text-sm md:text-base ${p.textColor} truncate`} title={p.player.name}>
                      {p.player.name}
                    </div>
                    <div className={`font-serif text-lg md:text-xl font-bold ${p.textColor}`}>
                      {p.player.score}
                    </div>
                  </motion.div>

                  {/* Podium block */}
                  <motion.div
                    className={`w-full ${p.height} parchment-border-double rounded-t-lg bg-gradient-to-t ${p.gradient} flex items-start justify-center pt-2 ${p.isWinner ? "glow-gold" : ""}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: p.delay + 0.2, duration: 0.5, ease: "easeOut" }}
                    style={{ transformOrigin: "bottom" }}
                  >
                    <span className={`font-serif text-3xl md:text-4xl font-bold ${p.textColor} drop-shadow-lg`}>
                      {p.place}
                    </span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Three Category Winners */}
      {(() => {
        const playersWithAnswers = players.filter(p => p.answers.length > 0);
        const topScorer = sorted[0];

        let fastest: Player | null = null;
        let fastestAvg = Infinity;
        playersWithAnswers.forEach(p => {
          const avg = p.answers.reduce((s, a) => s + a.time, 0) / p.answers.length;
          if (avg < fastestAvg) { fastestAvg = avg; fastest = p; }
        });

        let mostAccurate: Player | null = null;
        let bestAcc = -1;
        playersWithAnswers.forEach(p => {
          const acc = p.answers.filter(a => a.correct).length / p.answers.length;
          if (acc > bestAcc) { bestAcc = acc; mostAccurate = p; }
        });

        const cats = [
          { key: "score", emoji: "🏆", title: "אלוף הניקוד", subtitle: "הניקוד הגבוה ביותר",
            player: topScorer, value: topScorer ? `${topScorer.score} נק׳` : "",
            color: "text-game-gold", border: "border-game-gold", bg: "from-game-gold/20 to-game-dark-gold/10" },
          { key: "fast", emoji: "⚡", title: "אלוף המהירות", subtitle: "תגובה מהירה ביותר",
            player: fastest, value: fastest ? `${fastestAvg.toFixed(1)} שנ׳` : "",
            color: "text-yellow-400", border: "border-yellow-400/60", bg: "from-yellow-400/20 to-orange-500/10" },
          { key: "acc", emoji: "🎯", title: "אלוף הדיוק", subtitle: "אחוז התשובות הנכונות",
            player: mostAccurate, value: mostAccurate ? `${Math.round(bestAcc * 100)}%` : "",
            color: "text-emerald-400", border: "border-emerald-400/60", bg: "from-emerald-400/20 to-green-600/10" },
        ].filter(c => c.player);

        if (cats.length === 0) return null;

        return (
          <motion.div
            className="w-full max-w-md mb-8 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <motion.h3
              className="font-serif text-2xl md:text-3xl text-game-dark-gold text-center mb-3"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ שלושת הזוכים ✨
            </motion.h3>
            <div className="w-32 mx-auto border-t-2 border-double border-game-border-gold mb-4" />
            <div className="grid grid-cols-1 gap-3">
              {cats.map((c, i) => (
                <motion.div
                  key={c.key}
                  className={`parchment-card parchment-border-double rounded-xl p-4 flex items-center gap-4 bg-gradient-to-l ${c.bg} border-2 ${c.border}`}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 1.7 + i * 0.25, type: "spring", stiffness: 180 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <motion.div
                    className="text-5xl"
                    animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {c.emoji}
                  </motion.div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className={`font-serif text-lg md:text-xl font-bold ${c.color}`}>{c.title}</div>
                    <div className="text-game-dark-gold/60 text-xs mb-1">{c.subtitle}</div>
                    <div className="font-serif text-xl text-game-dark-gold font-bold truncate">{c.player!.name}</div>
                    <div className={`font-serif text-base ${c.color} font-bold`}>{c.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Leaderboard */}
      {sorted.length > 0 && (
        <div className="w-full max-w-md space-y-2.5 mb-6 relative z-10">
          {sorted.map((player, i) => (
            <motion.div
              key={player.id}
              className={`parchment-card rounded-xl p-4 flex items-center gap-4 ${i === 0 ? "parchment-border-double glow-gold" : ""}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 200 }}
            >
              <motion.span
                className="text-2xl w-10 text-center"
                animate={i === 0 ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 1.5, repeat: i === 0 ? Infinity : 0 }}
              >
                {medals[i] || `${i + 1}`}
              </motion.span>
              <span className="font-serif text-xl text-game-dark-gold flex-1">{player.name}</span>
              <motion.span
                className="font-serif text-xl text-game-gold font-bold"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.15, type: "spring" }}
              >
                {player.score}
              </motion.span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Special titles section */}
      {showTitles && specialTitles.length > 0 && (
        <motion.div
          className="w-full max-w-md mb-8 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <motion.h3
            className="font-serif text-2xl text-game-dark-gold text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✨ תארים מיוחדים
          </motion.h3>
          <div className="grid grid-cols-1 gap-3">
            {specialTitles.map((title, i) => (
              <motion.div
                key={i}
                className="parchment-card rounded-xl p-4 flex items-center gap-3 border border-game-border-gold/50"
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: i * 0.2, type: "spring", stiffness: 180 }}
              >
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: 2 }}
                >
                  {title.emoji}
                </motion.span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {title.icon}
                    <span className="font-serif text-lg text-game-dark-gold font-bold">{title.title}</span>
                  </div>
                  <p className="text-game-gold font-bold">{title.playerName}</p>
                  <p className="text-game-dark-gold/50 text-sm">{title.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        className="flex flex-wrap gap-4 relative z-10 justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
          <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); setShowStats(true); }} className="gap-3">
            <BarChart3 className="w-5 h-5" />
            סטטיסטיקות
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
          <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); onRestart(); }} className="gap-3">
            <RotateCcw className="w-5 h-5" />
            משחק חדש
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="xl" onClick={() => { SoundEffects.click(); onHome(); }} className="gap-3 border-game-border-gold text-game-dark-gold hover:bg-game-cream">
            <Home className="w-5 h-5" />
            דף הבית
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player, Question } from "@/types/game";
import { Trophy, RotateCcw, Home, Sparkles, BarChart3 } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireConfetti } from "@/hooks/useConfetti";
import { GameStatsPanel } from "./GameStatsPanel";

type Props = {
  players: Player[];
  questions: Question[];
  onRestart: () => void;
  onHome: () => void;
};

export function GameFinished({ players, onRestart, onHome }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    SoundEffects.victory();
    fireConfetti();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating golden leaves */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -40, -80],
            x: [0, (Math.random() - 0.5) * 40],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          🍂
        </motion.div>
      ))}

      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0], y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: 3 }}
        >
          <Trophy className="w-24 h-24 text-game-gold mx-auto mb-4 drop-shadow-lg" />
        </motion.div>

        <motion.h1
          className="font-serif text-5xl md:text-6xl text-game-dark-gold text-shadow-game mb-2"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          סיום המשחק! 🎉
        </motion.h1>
        <div className="w-40 mx-auto border-t-2 border-double border-game-border-gold my-4" />

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6 text-game-gold" />
            <p className="font-serif text-3xl text-game-dark-gold">
              🏆 המנצח: <span className="text-game-gold font-bold">{winner.name}</span> - {winner.score} נקודות!
            </p>
            <Sparkles className="w-6 h-6 text-game-gold" />
          </motion.div>
        )}
      </motion.div>

      {sorted.length > 0 && (
        <div className="w-full max-w-md space-y-3 mb-10 relative z-10">
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

      <motion.div
        className="flex gap-4 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
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

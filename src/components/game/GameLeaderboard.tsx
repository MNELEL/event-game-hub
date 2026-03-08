import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { ArrowLeft, Trophy, Crown, Star } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";

type Props = {
  players: Player[];
  onNext: () => void;
  isFinal: boolean;
};

export function GameLeaderboard({ players, onNext, isFinal }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    SoundEffects.leaderboard();
  }, []);

  // Reveal players one by one from bottom
  useEffect(() => {
    if (revealedCount < sorted.length) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, sorted.length]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Star className="w-4 h-4 text-game-gold" />
        </motion.div>
      ))}

      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -60, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 12 }}
      >
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotateZ: [0, -5, 5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="w-16 h-16 text-game-gold mx-auto mb-3 drop-shadow-lg" />
        </motion.div>
        <motion.h2
          className="font-serif text-4xl text-game-dark-gold text-shadow-game"
          initial={{ opacity: 0, letterSpacing: "0.3em" }}
          animate={{ opacity: 1, letterSpacing: "0em" }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isFinal ? "תוצאות סופיות!" : "טבלת דירוג"}
        </motion.h2>
        <motion.div
          className="w-32 mx-auto border-t-2 border-double border-game-border-gold mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
      </motion.div>

      {/* Players list — revealed from bottom rank to top */}
      <div className="w-full max-w-lg space-y-3 mb-10">
        {sorted.length === 0 ? (
          <p className="text-center text-game-dark-gold/60 font-serif text-lg">אין שחקנים עדיין</p>
        ) : (
          <AnimatePresence>
            {sorted.map((player, i) => {
              // Reveal from bottom: show index (sorted.length - 1 - i) first
              const reverseIndex = sorted.length - 1 - i;
              const isRevealed = reverseIndex < revealedCount;

              if (!isRevealed) return null;

              return (
                <motion.div
                  key={player.id}
                  className={`parchment-card rounded-xl p-4 flex items-center gap-4 relative overflow-hidden ${i === 0 ? "parchment-border-double glow-gold" : ""}`}
                  initial={{ opacity: 0, x: 80, scale: 0.6, rotateY: 30 }}
                  animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 16,
                  }}
                  layout
                >
                  {/* Winner crown */}
                  {i === 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Crown className="w-6 h-6 text-game-gold" />
                    </motion.div>
                  )}

                  {/* Rank shimmer for top 3 */}
                  {i < 3 && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-game-gold/10 to-transparent pointer-events-none"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 + i * 0.5 }}
                    />
                  )}

                  <motion.span
                    className="text-2xl w-10 text-center"
                    animate={i === 0 ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, -10, 10, 0],
                    } : {}}
                    transition={{ duration: 1.5, repeat: i === 0 ? Infinity : 0 }}
                  >
                    {medals[i] || `${i + 1}`}
                  </motion.span>
                  <span className="font-serif text-xl text-game-dark-gold flex-1">{player.name}</span>

                  {/* Animated score counter */}
                  <motion.span
                    className="font-serif text-2xl text-game-gold font-bold"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    {player.score}
                  </motion.span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sorted.length * 0.3 + 0.5, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button variant="gold" size="xl" onClick={() => { SoundEffects.click(); onNext(); }} className="gap-3">
          <ArrowLeft className="w-5 h-5" />
          {isFinal ? "חזרה" : "שאלה הבאה"}
        </Button>
      </motion.div>
    </div>
  );
}

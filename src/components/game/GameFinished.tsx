import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { Trophy, RotateCcw, Home, Sparkles } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import { fireConfetti } from "@/hooks/useConfetti";

type Props = {
  players: Player[];
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
      {/* Animated background sparkles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-game-gold/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
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
          className="font-display text-5xl md:text-6xl text-game-gold text-shadow-game mb-2"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          סיום המשחק! 🎉
        </motion.h1>

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6 text-game-gold" />
            <p className="font-display text-3xl text-primary-foreground">
              🏆 המנצח: <span className="text-game-gold">{winner.name}</span> - {winner.score} נקודות!
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
              className={`bg-game-surface/60 rounded-2xl p-4 flex items-center gap-4 border ${i === 0 ? "border-game-gold/50 glow-gold" : "border-game-glow/20"}`}
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
              <span className="font-display text-xl text-primary-foreground flex-1">{player.name}</span>
              <motion.span
                className="font-display text-xl text-game-gold font-bold"
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
          <Button variant="game" size="xl" onClick={() => { SoundEffects.click(); onHome(); }} className="gap-3">
            <Home className="w-5 h-5" />
            דף הבית
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

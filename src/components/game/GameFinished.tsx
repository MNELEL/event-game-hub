import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { Trophy, RotateCcw, Home } from "lucide-react";

type Props = {
  players: Player[];
  onRestart: () => void;
  onHome: () => void;
};

export function GameFinished({ players, onRestart, onHome }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1, repeat: 3 }}
        >
          <Trophy className="w-24 h-24 text-game-gold mx-auto mb-4" />
        </motion.div>
        <h1 className="font-display text-5xl md:text-6xl text-game-gold text-shadow-game mb-2">
          סיום המשחק! 🎉
        </h1>
        {winner && (
          <motion.p
            className="font-display text-3xl text-primary-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🏆 המנצח: <span className="text-game-gold">{winner.name}</span> - {winner.score} נקודות!
          </motion.p>
        )}
      </motion.div>

      {sorted.length > 0 && (
        <div className="w-full max-w-md space-y-3 mb-10">
          {sorted.map((player, i) => (
            <motion.div
              key={player.id}
              className={`bg-game-surface/60 rounded-2xl p-4 flex items-center gap-4 border ${i === 0 ? "border-game-gold/50 glow-gold" : "border-game-glow/20"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <span className="text-2xl w-10 text-center">{medals[i] || `${i + 1}`}</span>
              <span className="font-display text-xl text-primary-foreground flex-1">{player.name}</span>
              <span className="font-display text-xl text-game-gold font-bold">{player.score}</span>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Button variant="gold" size="xl" onClick={onRestart} className="gap-3">
          <RotateCcw className="w-5 h-5" />
          משחק חדש
        </Button>
        <Button variant="game" size="xl" onClick={onHome} className="gap-3">
          <Home className="w-5 h-5" />
          דף הבית
        </Button>
      </motion.div>
    </div>
  );
}

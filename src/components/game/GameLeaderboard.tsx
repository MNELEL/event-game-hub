import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { ArrowLeft, Trophy, Medal } from "lucide-react";

type Props = {
  players: Player[];
  onNext: () => void;
  isFinal: boolean;
};

export function GameLeaderboard({ players, onNext, isFinal }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Trophy className="w-16 h-16 text-game-gold mx-auto mb-3" />
        <h2 className="font-display text-4xl text-primary-foreground text-shadow-game">
          {isFinal ? "תוצאות סופיות!" : "טבלת דירוג"}
        </h2>
      </motion.div>

      <div className="w-full max-w-lg space-y-3 mb-10">
        {sorted.length === 0 ? (
          <p className="text-center text-primary-foreground/60 font-display text-lg">אין שחקנים עדיין</p>
        ) : (
          sorted.map((player, i) => (
            <motion.div
              key={player.id}
              className={`bg-game-surface/60 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 border ${i === 0 ? "border-game-gold/50 glow-gold" : "border-game-glow/20"}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <span className="text-2xl w-10 text-center">{medals[i] || `${i + 1}`}</span>
              <span className="font-display text-xl text-primary-foreground flex-1">{player.name}</span>
              <span className="font-display text-2xl text-game-gold font-bold">{player.score}</span>
            </motion.div>
          ))
        )}
      </div>

      <Button variant="gold" size="xl" onClick={onNext} className="gap-3">
        <ArrowLeft className="w-5 h-5" />
        {isFinal ? "חזרה" : "שאלה הבאה"}
      </Button>
    </div>
  );
}

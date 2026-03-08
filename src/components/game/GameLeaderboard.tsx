import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { ArrowLeft, Trophy } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";

type Props = {
  players: Player[];
  onNext: () => void;
  isFinal: boolean;
};

export function GameLeaderboard({ players, onNext, isFinal }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    SoundEffects.leaderboard();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="w-16 h-16 text-game-gold mx-auto mb-3" />
        </motion.div>
        <h2 className="font-serif text-4xl text-game-dark-gold text-shadow-game">
          {isFinal ? "תוצאות סופיות!" : "טבלת דירוג"}
        </h2>
        <div className="w-32 mx-auto border-t-2 border-double border-game-border-gold mt-3" />
      </motion.div>

      <div className="w-full max-w-lg space-y-3 mb-10">
        {sorted.length === 0 ? (
          <p className="text-center text-game-dark-gold/60 font-serif text-lg">אין שחקנים עדיין</p>
        ) : (
          sorted.map((player, i) => (
            <motion.div
              key={player.id}
              className={`parchment-card rounded-xl p-4 flex items-center gap-4 ${i === 0 ? "parchment-border-double glow-gold" : ""}`}
              initial={{ opacity: 0, x: 60, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 200 }}
            >
              <motion.span
                className="text-2xl w-10 text-center"
                animate={i === 0 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: i === 0 ? Infinity : 0 }}
              >
                {medals[i] || `${i + 1}`}
              </motion.span>
              <span className="font-serif text-xl text-game-dark-gold flex-1">{player.name}</span>
              <motion.span
                className="font-serif text-2xl text-game-gold font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.2 + 0.3 }}
              >
                {player.score}
              </motion.span>
            </motion.div>
          ))
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sorted.length * 0.2 + 0.5 }}
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

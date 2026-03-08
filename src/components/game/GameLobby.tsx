import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/game";
import { Play, UserPlus, Users, Monitor, Phone } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";

type Props = {
  gameCode: string;
  players: Player[];
  onAddPlayer: (name: string) => Player | Promise<Player | null>;
  onStart: () => void;
  questionsCount: number;
};

export function GameLobby({ gameCode, players, onAddPlayer, onStart, questionsCount }: Props) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const prevCount = useRef(players.length);

  useEffect(() => {
    if (players.length > prevCount.current) {
      SoundEffects.playerJoin();
    }
    prevCount.current = players.length;
  }, [players.length]);

  const handleAdd = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const handleStart = () => {
    SoundEffects.gameStart();
    setTimeout(onStart, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Decorative leaf ornaments */}
        <motion.div
          className="text-5xl mb-2 opacity-60"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🌿
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-serif text-6xl md:text-7xl font-bold text-game-dark-gold text-shadow-game mb-2"
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🧠 מגה מוח
        </motion.h1>
        <div className="w-40 mx-auto border-t-2 border-double border-game-border-gold my-4" />

        {/* Connection instructions */}
        <motion.div
          className="parchment-card rounded-2xl p-8 mb-8 relative watercolor-corners overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-2xl text-game-dark-gold mb-6">הצטרפו למשחק!</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              className="bg-game-cream rounded-xl p-6 border border-game-border-gold/30"
              whileHover={{ scale: 1.02, borderColor: "hsl(35 45% 56%)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Monitor className="w-10 h-10 text-game-gold mx-auto mb-3" />
              <h3 className="font-serif text-lg text-game-dark-gold mb-2">דרך האינטרנט</h3>
              <p className="text-game-dark-gold/60 text-sm mb-3">היכנסו לכתובת:</p>
              <motion.div
                className="bg-white/70 rounded-lg p-3 font-mono text-game-dark-gold text-lg border border-game-border-gold/40"
                animate={{ boxShadow: ["0 0 8px hsl(35 55% 53% / 0.15)", "0 0 20px hsl(35 55% 53% / 0.3)", "0 0 8px hsl(35 55% 53% / 0.15)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                megabrain.app/{gameCode}
              </motion.div>
            </motion.div>

            <motion.div
              className="bg-game-cream rounded-xl p-6 border border-game-border-gold/30"
              whileHover={{ scale: 1.02, borderColor: "hsl(35 45% 56%)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Phone className="w-10 h-10 text-game-gold mx-auto mb-3" />
              <h3 className="font-serif text-lg text-game-dark-gold mb-2">דרך הטלפון</h3>
              <p className="text-game-dark-gold/60 text-sm mb-3">חייגו למספר:</p>
              <motion.div
                className="bg-white/70 rounded-lg p-3 font-mono text-game-dark-gold text-lg border border-game-border-gold/40 direction-ltr"
                animate={{ boxShadow: ["0 0 8px hsl(35 55% 53% / 0.15)", "0 0 20px hsl(35 55% 53% / 0.3)", "0 0 8px hsl(35 55% 53% / 0.15)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                03-7737970
              </motion.div>
            </motion.div>
          </div>

          <p className="text-game-dark-gold/50 text-xs mt-4">
            קוד משחק: <span className="text-game-gold font-bold text-lg">{gameCode}</span>
          </p>
        </motion.div>

        {/* Add players manually */}
        <div className="parchment-card rounded-xl p-6 mb-6">
          <div className="flex gap-3 items-center mb-4">
            <Input
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="הוסיפו שחקן..."
              className="bg-white/60 border-game-border-gold/40 text-game-dark-gold h-11"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Button variant="gold" size="default" onClick={handleAdd} disabled={!newPlayerName.trim()}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-game-dark-gold/60">
            <Users className="w-4 h-4" />
            <span className="text-sm">{players.length} שחקנים מחוברים</span>
          </div>

          <AnimatePresence>
            {players.length > 0 && (
              <motion.div className="flex flex-wrap gap-2 mt-3" layout>
                {players.map((p) => (
                  <motion.span
                    key={p.id}
                    className="bg-game-gold/20 text-game-dark-gold px-3 py-1 rounded-full text-sm font-medium border border-game-border-gold/30"
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    🌱 {p.name}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="gold"
            size="xl"
            onClick={handleStart}
            disabled={questionsCount === 0}
            className="gap-3 text-xl px-12"
          >
            <Play className="w-6 h-6" />
            התחל משחק!
          </Button>
        </motion.div>

        <p className="text-game-dark-gold/50 text-sm mt-3">{questionsCount} שאלות מוכנות</p>
      </motion.div>
    </div>
  );
}

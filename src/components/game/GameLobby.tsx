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
  onAddPlayer: (name: string) => Player;
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
        {/* Animated title */}
        <motion.h1
          className="font-display text-6xl md:text-7xl font-bold text-game-gold text-shadow-game mb-4"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🧠 מגה מוח
        </motion.h1>

        {/* Floating particles effect */}
        <div className="relative">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-game-gold/30"
              style={{ left: `${15 + i * 15}%`, top: -20 }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        {/* Connection instructions */}
        <motion.div
          className="bg-game-surface/60 backdrop-blur-md rounded-3xl p-8 mb-8 border border-game-glow/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl text-primary-foreground mb-6">הצטרפו למשחק!</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              className="bg-game-bg/50 rounded-2xl p-6 border border-game-glow/20"
              whileHover={{ scale: 1.03, borderColor: "hsl(250 80% 65% / 0.5)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Monitor className="w-10 h-10 text-game-gold mx-auto mb-3" />
              <h3 className="font-display text-lg text-primary-foreground mb-2">דרך האינטרנט</h3>
              <p className="text-primary-foreground/60 text-sm mb-3">היכנסו לכתובת:</p>
              <motion.div
                className="bg-game-bg rounded-xl p-3 font-mono text-game-gold text-lg"
                animate={{ boxShadow: ["0 0 10px hsl(45 100% 50% / 0.2)", "0 0 25px hsl(45 100% 50% / 0.4)", "0 0 10px hsl(45 100% 50% / 0.2)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                megabrain.app/{gameCode}
              </motion.div>
            </motion.div>

            <motion.div
              className="bg-game-bg/50 rounded-2xl p-6 border border-game-glow/20"
              whileHover={{ scale: 1.03, borderColor: "hsl(250 80% 65% / 0.5)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Phone className="w-10 h-10 text-game-gold mx-auto mb-3" />
              <h3 className="font-display text-lg text-primary-foreground mb-2">דרך הטלפון</h3>
              <p className="text-primary-foreground/60 text-sm mb-3">חייגו למספר:</p>
              <motion.div
                className="bg-game-bg rounded-xl p-3 font-mono text-game-gold text-lg direction-ltr"
                animate={{ boxShadow: ["0 0 10px hsl(45 100% 50% / 0.2)", "0 0 25px hsl(45 100% 50% / 0.4)", "0 0 10px hsl(45 100% 50% / 0.2)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                03-7737970
              </motion.div>
            </motion.div>
          </div>

          <p className="text-primary-foreground/40 text-xs mt-4">
            קוד משחק: <span className="text-game-gold font-bold text-lg">{gameCode}</span>
          </p>
        </motion.div>

        {/* Add players manually */}
        <div className="bg-game-surface/40 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-game-glow/10">
          <div className="flex gap-3 items-center mb-4">
            <Input
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="הוסיפו שחקן..."
              className="bg-game-bg/50 border-game-glow/30 text-primary-foreground h-11"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Button variant="game" size="default" onClick={handleAdd} disabled={!newPlayerName.trim()}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-primary-foreground/60">
            <Users className="w-4 h-4" />
            <span className="text-sm">{players.length} שחקנים מחוברים</span>
          </div>

          <AnimatePresence>
            {players.length > 0 && (
              <motion.div className="flex flex-wrap gap-2 mt-3" layout>
                {players.map((p, i) => (
                  <motion.span
                    key={p.id}
                    className="bg-game-glow/20 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium"
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {p.name}
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

        <p className="text-primary-foreground/40 text-sm mt-3">{questionsCount} שאלות מוכנות</p>
      </motion.div>
    </div>
  );
}

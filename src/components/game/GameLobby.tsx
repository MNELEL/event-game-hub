import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/game";
import { Play, UserPlus, Users, Monitor, Phone, QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  const [copied, setCopied] = useState(false);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start lobby background music on mount
  useEffect(() => {
    SoundEffects.startMusic('lobby');
    return () => SoundEffects.stopMusic();
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating leaves background */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ left: `${10 + i * 12}%`, top: `-5%` }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, (i % 2 === 0 ? 1 : -1) * 30, 0],
            rotate: [0, 180, 360],
            opacity: [0, 0.5, 0.3, 0],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            delay: i * 1.2,
            ease: "linear",
          }}
        >
          {["🍂", "🌿", "🍃", "🌱"][i % 4]}
        </motion.div>
      ))}

      <motion.div
        className="text-center max-w-2xl w-full relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Grand entrance animation */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 12, duration: 1 }}
        >
          {/* Decorative top ornament */}
          <motion.div
            className="text-4xl mb-3 opacity-50"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 0.5 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            ✦ 🌿 ✦
          </motion.div>

          {/* Brain icon with glow pulse */}
          <motion.div
            className="text-8xl md:text-9xl mb-2 inline-block"
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
          >
            <motion.span
              className="inline-block"
              animate={{
                filter: [
                  "drop-shadow(0 0 8px hsl(35 55% 53% / 0.3))",
                  "drop-shadow(0 0 25px hsl(35 55% 53% / 0.6))",
                  "drop-shadow(0 0 8px hsl(35 55% 53% / 0.3))",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              🧠
            </motion.span>
          </motion.div>

          {/* Title with letter-by-letter reveal */}
          <motion.h1
            className="font-serif text-6xl md:text-8xl font-bold text-game-dark-gold text-shadow-game"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          >
            מגה מוח
          </motion.h1>

          {/* Subtitle reveal */}
          <motion.p
            className="font-serif text-xl text-game-gold/70 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            חידון ידע אינטראקטיבי
          </motion.p>

          {/* Gold ornamental line */}
          <motion.div
            className="flex items-center justify-center gap-3 my-4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-game-border-gold" />
            <motion.span
              className="text-game-gold text-lg"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              ✦
            </motion.span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-game-border-gold" />
          </motion.div>
        </motion.div>

        {/* Connection instructions */}
        <motion.div
          className="parchment-card rounded-2xl p-8 mb-8 relative watercolor-corners overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 80 }}
        >
          <h2 className="font-serif text-2xl text-game-dark-gold mb-6">הצטרפו למשחק!</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {window.location.host}/play
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

            {/* QR Code */}
            <motion.div
              className="bg-game-cream rounded-xl p-6 border border-game-border-gold/30 flex flex-col items-center"
              whileHover={{ scale: 1.02, borderColor: "hsl(35 45% 56%)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <QrCode className="w-10 h-10 text-game-gold mb-3" />
              <h3 className="font-serif text-lg text-game-dark-gold mb-2">סרקו QR</h3>
              <p className="text-game-dark-gold/60 text-sm mb-3">סרקו עם הטלפון:</p>
              <motion.div
                className="bg-white rounded-xl p-3 border border-game-border-gold/40 inline-block"
                animate={{ boxShadow: ["0 0 8px hsl(35 55% 53% / 0.15)", "0 0 20px hsl(35 55% 53% / 0.3)", "0 0 8px hsl(35 55% 53% / 0.15)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <QRCodeSVG
                  value={`${window.location.origin}/play?code=${gameCode}`}
                  size={120}
                  bgColor="transparent"
                  fgColor="hsl(35, 60%, 25%)"
                  level="M"
                />
              </motion.div>
            </motion.div>
          </div>

          <p className="text-game-dark-gold/50 text-xs mt-4 flex items-center justify-center gap-2">
            קוד משחק: <span className="text-game-gold font-bold text-lg">{gameCode}</span>
            <button
              onClick={copyGameCode}
              className="inline-flex items-center gap-1 bg-game-gold/20 hover:bg-game-gold/40 text-game-dark-gold text-xs px-2 py-1 rounded-lg transition-colors border border-game-border-gold/30"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "הועתק!" : "העתק"}
            </button>
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

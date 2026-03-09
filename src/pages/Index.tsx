import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gamepad2, Settings, BookOpen, Sparkles, Users, Zap, Download } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen game-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-game-glow/10"
            style={{
              width: Math.random() * 100 + 20,
              height: Math.random() * 100 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h1 className="font-display text-7xl md:text-8xl font-bold text-game-gold text-shadow-game mb-2">
            🧠 מגה מוח
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/80 font-body">
            משחק הטריוויה האינטראקטיבי שישגע את כולם!
          </p>
        </motion.div>

        <motion.p
          className="text-primary-foreground/60 mb-10 text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          מתאים לאירועים משפחתיים, ערבי גיבוש, כנסים, ימי הולדת, בת/בר מצווה ועוד...
          <br />
          פשוט ליצור, קל להפעיל, בלתי נשכח!
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="gold" size="xl" onClick={() => navigate("/admin")} className="gap-3">
            <Settings className="w-6 h-6" />
            ממשק ניהול
          </Button>
          <Button variant="game" size="xl" onClick={() => navigate("/host")} className="gap-3">
            <Gamepad2 className="w-6 h-6" />
            הפעלת משחק
          </Button>
        </motion.div>

        <motion.div
          className="mt-4 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <Button variant="outline" size="lg" onClick={() => navigate("/install")} className="gap-2 border-game-glow/30 text-primary-foreground/70 hover:text-primary-foreground hover:border-game-glow/60">
            <Download className="w-5 h-5" />
            התקן אפליקציה
          </Button>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: BookOpen, title: "שאלות מוכנות", desc: "מאגר שאלות מגוון בנושאים שונים" },
            { icon: Users, title: "מרובה משתתפים", desc: "כולם משחקים מהטלפון" },
            { icon: Zap, title: "חוויה מושלמת", desc: "אנימציות, צלילים ודירוג חי" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="bg-game-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-game-glow/20"
              whileHover={{ scale: 1.05, borderColor: "hsl(250 80% 65% / 0.5)" }}
            >
              <feature.icon className="w-10 h-10 text-game-gold mx-auto mb-3" />
              <h3 className="font-display text-lg text-primary-foreground font-bold mb-1">{feature.title}</h3>
              <p className="text-primary-foreground/60 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;

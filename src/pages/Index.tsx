import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gamepad2, Settings, BookOpen, Users, Zap, Download, WifiOff } from "lucide-react";
import { ThemeButton } from "@/components/game/ThemeButton";

const Index = () => {
  const navigate = useNavigate();

  return (
    // 1. `main` landmark — fixes "Document does not have a main landmark"
    <div className="min-h-screen game-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      <ThemeButton />
      {/* Decorative background — aria-hidden so screen readers skip it */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
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
            animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: Math.random() * 4 + 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* 2. Wrap in <main> — fixes missing landmark */}
      <main className="relative z-10 text-center max-w-2xl w-full">
        <motion.div
          className="mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* H1 — correct */}
          <h1 className="font-display text-7xl md:text-8xl font-bold text-game-gold text-shadow-game mb-2">
            🧠 החגיגה של חיוש
          </h1>
          {/* 3. Contrast fix: /80 → full opacity for better contrast */}
          <p className="text-xl md:text-2xl text-foreground/90 font-body">
            משחק הטריוויה האינטראקטיבי שישגע את כולם!
          </p>
        </motion.div>

        <motion.p
          className="text-foreground/75 mb-10 text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          מתאים לאירועים משפחתיים, ערבי גיבוש, כנסים, ימי הולדת, בת/בר מצווה ועוד...
          <br />
          פשוט ליצור, קל להפעיל, בלתי נשכח!
        </motion.p>

        <motion.div
          className="flex flex-col gap-4 items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="game" size="xl" onClick={() => navigate("/play")} className="gap-3 w-full sm:w-auto text-2xl px-12 py-6">
            <Users className="w-7 h-7" aria-hidden="true" />
            הצטרף למשחק
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gold" size="lg" onClick={() => navigate("/host")} className="gap-2">
              <Gamepad2 className="w-5 h-5" aria-hidden="true" />
              הפעלת משחק
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/admin")} className="gap-2">
              <Settings className="w-5 h-5" aria-hidden="true" />
              ממשק ניהול
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="mt-4 flex gap-3 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <Button variant="outline" size="lg" onClick={() => navigate("/install")} className="gap-2">
            <Download className="w-5 h-5" aria-hidden="true" />
            התקן אפליקציה
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/offline")} className="gap-2">
            <WifiOff className="w-5 h-5" aria-hidden="true" />
            משחק אופליין
          </Button>
        </motion.div>

        {/* Feature cards — H2 instead of H3 to fix heading order (H1→H2, not H1→H3) */}
        <motion.section
          aria-label="יתרונות המשחק"
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: BookOpen, title: "שאלות מוכנות",    desc: "מאגר שאלות מגוון בנושאים שונים" },
            { icon: Users,    title: "מרובה משתתפים",   desc: "כולם משחקים מהטלפון"           },
            { icon: Zap,      title: "חוויה מושלמת",    desc: "אנימציות, צלילים ודירוג חי"     },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="bg-game-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-game-glow/20"
              whileHover={{ scale: 1.05, borderColor: "hsl(250 80% 65% / 0.5)" }}
            >
              <feature.icon className="w-10 h-10 text-game-gold mx-auto mb-3" aria-hidden="true" />
              {/* 4. H2 — fixes sequential heading order (was H3) */}
              <h2 className="font-display text-lg text-foreground font-bold mb-1">{feature.title}</h2>
              <p className="text-foreground/70 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.section>
      </main>
    </div>
  );
};

export default Index;

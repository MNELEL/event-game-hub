import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Languages,
  Users,
  Timer,
  BarChart3,
  WifiOff,
  Trophy,
  Gamepad2,
  Shield,
  Zap,
  Phone,
} from "lucide-react";

const features = [
  { icon: Languages, title: "שאלות בעברית", desc: "מאגר מגוון, תמיכה בתמונות, אודיו ווידאו" },
  { icon: Users, title: "רב-משתתפים", desc: "כולם מצטרפים מהטלפון דרך קוד או QR" },
  { icon: Timer, title: "טיימר מסונכרן", desc: "סנכרון מדויק בין מסך ראשי לכל שחקן" },
  { icon: BarChart3, title: "אנליטיקה חיה", desc: "התפלגות תשובות, לוח תוצאות, גרפים" },
  { icon: WifiOff, title: "אופליין & PWA", desc: "פועל גם ללא רשת, מותקן כאפליקציה" },
  { icon: Trophy, title: "תארי סיום חגיגיים", desc: "האלוף, המהיר, המדויק — עם קונפטי ומוזיקה" },
];

const steps = [
  { n: "1", title: "המנחה יוצר משחק", desc: "מתחבר לממשק הניהול ומפעיל סבב חדש" },
  { n: "2", title: "השחקנים מצטרפים", desc: "סורקים QR או מזינים קוד מהטלפון" },
  { n: "3", title: "משחקים ומנצחים", desc: "עונים על שאלות, צוברים נקודות, ומקבלים תארים" },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen game-gradient py-10 px-4 relative overflow-hidden" dir="rtl">
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </motion.div>

        <motion.div
          className="parchment-card parchment-border-double watercolor-corners rounded-3xl p-8 md:p-12 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              className="font-display text-5xl md:text-6xl font-bold text-game-gold text-shadow-game mb-3"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🧠 אודות חיוש בת מצוה
            </motion.h1>
            <p className="text-lg text-game-dark-gold font-body">
              משחק הטריוויה האינטראקטיבי לכל אירוע
            </p>
          </div>

          {/* Description */}
          <motion.p
            className="text-center text-foreground/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            חיוש בת מצוה מאפשר לך להפעיל משחק טריוויה מקצועי באירועים משפחתיים, גיבושים,
            ימי הולדת, בת/בר מצווה וכנסים. המנחה מציג את המשחק על מסך גדול, והשחקנים
            מצטרפים מהטלפון. פשוט ליצירה, קל להפעלה, בלתי נשכח.
          </motion.p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-game-cream/60 border-2 border-game-border-gold/40 rounded-2xl p-5 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ scale: 1.03, borderColor: "hsl(var(--game-gold))" }}
              >
                <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-3 glow-gold">
                  <f.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* How to play */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="font-display text-3xl font-bold text-center text-game-dark-gold mb-6">
              איך משחקים?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="bg-game-parchment/70 border-2 border-game-border-gold/50 rounded-2xl p-5 relative"
                >
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full gold-gradient flex items-center justify-center font-display font-bold text-2xl text-primary-foreground glow-gold">
                    {s.n}
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2 mt-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tech */}
          <motion.div
            className="bg-game-cream/40 border border-game-border-gold/30 rounded-2xl p-6 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <h2 className="font-display text-2xl font-bold text-center text-game-dark-gold mb-4">
              מאחורי הקלעים
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-8 h-8 text-game-gold" />
                <span className="font-bold text-foreground">Realtime</span>
                <span className="text-xs text-muted-foreground">סנכרון מיידי בין כל המכשירים</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-8 h-8 text-game-gold" />
                <span className="font-bold text-foreground">אבטחה</span>
                <span className="text-xs text-muted-foreground">חישוב ציון ב-server, anti-spoofing</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Gamepad2 className="w-8 h-8 text-game-gold" />
                <span className="font-bold text-foreground">חוויה</span>
                <span className="text-xs text-muted-foreground">צלילים דינמיים, אנימציות, קונפטי</span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <Button variant="gold" size="lg" onClick={() => navigate("/host")} className="gap-2">
              <Gamepad2 className="w-5 h-5" />
              הפעלת משחק
            </Button>
            <Button variant="game" size="lg" onClick={() => navigate("/play")} className="gap-2">
              <Users className="w-5 h-5" />
              הצטרפות למשחק
            </Button>
          </motion.div>

          {/* Contact */}
          <div className="text-center pt-6 border-t border-game-border-gold/30">
            <div className="flex items-center justify-center gap-2 text-game-dark-gold font-bold">
              <Phone className="w-4 h-4" />
              <span>03-7737970</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">נבנה עם ❤️ ב-Lovable</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;

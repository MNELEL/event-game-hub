import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else if (isSignUp) {
      toast({ title: "נרשמת בהצלחה!", description: "בדוק את המייל לאישור החשבון" });
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen game-gradient flex items-center justify-center p-6" dir="rtl">
      <motion.div
        className="bg-game-surface/80 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-game-glow/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-4xl text-game-gold text-center mb-2">🧠 מגה מוח</h1>
        <p className="text-primary-foreground/60 text-center mb-8">
          {isSignUp ? "הרשמה לממשק ניהול" : "כניסה לממשק ניהול"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="אימייל"
            className="bg-game-bg/50 border-game-glow/30 text-primary-foreground h-12"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="bg-game-bg/50 border-game-glow/30 text-primary-foreground h-12"
            required
            minLength={6}
          />
          <Button variant="gold" size="lg" className="w-full gap-2" type="submit" disabled={loading}>
            {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? "טוען..." : isSignUp ? "הרשמה" : "כניסה"}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary-foreground/60 hover:text-game-gold text-sm transition-colors"
          >
            {isSignUp ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הירשם"}
          </button>
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-primary-foreground/40 hover:text-primary-foreground/60 text-xs transition-colors flex items-center gap-1 mx-auto"
            >
              <Home className="w-3 h-3" />
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

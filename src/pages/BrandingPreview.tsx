import { useMemo, useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { branding } from "@/config/branding";
import { brandingThemes, type BrandingTheme, type ThemeTokens } from "@/config/themes";
import { setActiveTheme, loadActiveThemeId } from "@/hooks/useThemeLoader";
import { toast } from "sonner";
import { Home, Check, Crown, Users, Play, QrCode, Trophy } from "lucide-react";

function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  // CSS custom properties via inline style
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) style[k] = v;
  return style as CSSProperties;
}

function HeroPreview() {
  return (
    <div className="game-gradient rounded-xl p-6 text-center border-2 border-game-border-gold/40 min-h-[260px] flex flex-col items-center justify-center" dir="rtl">
      <div className="text-4xl mb-2">{branding.icons.festive}</div>
      <h1 className="font-display text-3xl font-bold text-game-gold text-shadow-game">{branding.name}</h1>
      <p className="text-game-dark-gold mt-2 text-sm">{branding.copy.heroSubtitle}</p>
      <div className="flex gap-2 mt-4">
        <button className="px-4 py-2 rounded-lg bg-game-gold text-white text-sm font-bold gold-gradient">הצטרף</button>
        <button className="px-4 py-2 rounded-lg border-2 border-game-border-gold text-game-dark-gold text-sm font-bold">הפעל</button>
      </div>
    </div>
  );
}

function LobbyPreview() {
  return (
    <div className="parchment-card rounded-xl p-5 min-h-[260px]" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-game-gold" />
        <h2 className="font-display text-xl text-game-dark-gold font-bold">לובי המשחק</h2>
      </div>
      <p className="text-xs text-game-dark-gold/70 mb-3">{branding.copy.lobbySubtitle}</p>
      <div className="bg-game-cream rounded-lg p-3 text-center mb-3 border border-game-border-gold/40">
        <div className="text-xs text-game-dark-gold/70">קוד משחק</div>
        <div className="font-display text-2xl font-bold text-game-gold tracking-widest">A1B2C3</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {["דנה", "יוסי", "מיכל"].map((n) => (
          <div key={n} className="bg-game-parchment rounded-md p-2 text-center text-game-dark-gold border border-game-border-gold/30">
            <Users className="w-3 h-3 mx-auto mb-1" />
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionPreview() {
  const answers = ["game-answer-1", "game-answer-2", "game-answer-3", "game-answer-4"];
  return (
    <div className="game-gradient rounded-xl p-5 min-h-[260px]" dir="rtl">
      <div className="parchment-card rounded-lg p-3 mb-3 text-center">
        <div className="text-xs text-game-dark-gold/60 mb-1">שאלה 3 / 10</div>
        <div className="font-display text-game-dark-gold font-bold">איזה צבע הכי אהוב על חיוש?</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {answers.map((c, i) => (
          <div key={i} className={`${c} rounded-lg p-3 text-white text-center text-sm font-bold shadow`}>
            תשובה {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardPreview() {
  return (
    <div className="parchment-card rounded-xl p-5 min-h-[260px]" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-game-gold" />
        <h2 className="font-display text-xl text-game-dark-gold font-bold">לוח התוצאות</h2>
      </div>
      <div className="space-y-2">
        {[
          { n: "מיכל", s: 920 },
          { n: "דנה", s: 780 },
          { n: "יוסי", s: 640 },
        ].map((p, i) => (
          <div key={p.n} className="flex items-center justify-between bg-game-cream rounded-lg px-3 py-2 border border-game-border-gold/40">
            <div className="flex items-center gap-2 text-game-dark-gold font-bold">
              <span className="w-6 h-6 rounded-full bg-game-gold text-white text-xs flex items-center justify-center">{i + 1}</span>
              {p.n}
            </div>
            <div className="text-game-dark-gold font-display font-bold">{p.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  { id: "hero", label: "מסך פתיחה", icon: Crown, render: () => <HeroPreview /> },
  { id: "lobby", label: "לובי", icon: Users, render: () => <LobbyPreview /> },
  { id: "question", label: "שאלה במשחק", icon: Play, render: () => <QuestionPreview /> },
  { id: "leaderboard", label: "תוצאות", icon: Trophy, render: () => <LeaderboardPreview /> },
];

const BrandingPreview = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(loadActiveThemeId());
  const selected = useMemo<BrandingTheme>(
    () => brandingThemes.find((t) => t.id === selectedId) ?? brandingThemes[0],
    [selectedId]
  );

  const previewStyle = tokensToStyle(selected.tokens);

  const apply = () => {
    setActiveTheme(selected.id);
    toast.success(`הערכה "${selected.label}" הוחלה על כל האפליקציה`);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-xl font-bold">תצוגה מקדימה של מיתוג</h1>
          </div>
          <Button onClick={apply} className="gap-2">
            <Check className="w-4 h-4" />
            החל ערכה
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <section>
          <h2 className="font-display text-lg font-bold mb-3">בחר ערכת צבעים</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {brandingThemes.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`text-right rounded-xl p-4 border-2 transition-all ${
                    active ? "border-primary shadow-lg scale-[1.02]" : "border-border hover:border-primary/50"
                  } bg-card`}
                >
                  <div className="flex gap-1 mb-3">
                    {t.swatch.map((c, i) => (
                      <div key={i} className="flex-1 h-8 rounded" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="font-display font-bold">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-3">תצוגה חיה של מסכים</h2>
          <div
            className="rounded-2xl border-2 border-border p-4 bg-background"
            style={previewStyle}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCREENS.map((s) => (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </div>
                  {s.render()}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            הערכה משנה את ה-CSS variables של game-* בלבד. שאר העיצוב נשאר זהה.
          </p>
        </section>
      </main>
    </div>
  );
};

export default BrandingPreview;

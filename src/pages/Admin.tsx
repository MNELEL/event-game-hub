import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { defaultQuestions } from "@/data/defaultQuestions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { QuestionEditor } from "@/components/game/QuestionEditor";
import { QuestionList } from "@/components/game/QuestionList";
import { GameSettingsPanel } from "@/components/game/GameSettingsPanel";
import { TutorialDialog } from "@/components/game/TutorialDialog";
import { QuestionImportExport } from "@/components/game/QuestionImportExport";
import { exportStandaloneHTML } from "@/utils/exportStandaloneHTML";
import {
  Play, HelpCircle, Settings, List, Plus, Home, LogOut,
  Loader2, FileDown, Users, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Tab = "questions" | "add" | "players" | "settings";
type PlayerRow = { id: string; name: string; score: number; connected: boolean; created_at: string; game_id: string; };
type GameRow   = { id: string; code: string; status: string; created_at: string; players?: PlayerRow[]; };

const tabConfig = [
  { id: "questions" as Tab, icon: List,     label: "שאלות"  },
  { id: "add"       as Tab, icon: Plus,     label: "הוספה"  },
  { id: "players"   as Tab, icon: Users,    label: "שחקנים" },
  { id: "settings"  as Tab, icon: Settings, label: "הגדרות" },
];

const Admin = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const store = useSupabaseQuestions();
  const [tab, setTab] = useState<Tab>("questions");
  const [showTutorial, setShowTutorial] = useState(false);
  const [games, setGames] = useState<GameRow[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchGamesWithPlayers = async () => {
    setPlayersLoading(true);
    const { data: gamesData } = await supabase
      .from("games").select("id, code, status, created_at")
      .order("created_at", { ascending: false }).limit(20);
    if (!gamesData) { setPlayersLoading(false); return; }
    const gamesWithPlayers = await Promise.all(
      gamesData.map(async (game) => {
        const { data: players } = await supabase
          .from("players").select("*").eq("game_id", game.id)
          .order("score", { ascending: false });
        return { ...game, players: players || [] };
      })
    );
    setGames(gamesWithPlayers);
    setPlayersLoading(false);
  };

  useEffect(() => { if (tab === "players") fetchGamesWithPlayers(); }, [tab]);

  const handleDeletePlayer = async (id: string) => {
    await supabase.from("players").delete().eq("id", id);
    toast.success("שחקן נמחק");
    fetchGamesWithPlayers();
  };
  const handleDeleteGame = async (id: string) => {
    await supabase.from("players").delete().eq("game_id", id);
    await supabase.from("games").delete().eq("id", id);
    toast.success("משחק נמחק");
    fetchGamesWithPlayers();
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground font-medium">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* Header */}
      <header className="bg-card/90 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-base text-foreground leading-tight">🧠 מגה מוח</h1>
              <p className="text-[11px] text-muted-foreground leading-none">ממשק ניהול</p>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {user && <span className="text-xs text-muted-foreground">{user.email}</span>}
            <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
              <HelpCircle className="w-4 h-4 ml-1" />הדרכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => { exportStandaloneHTML(store.questions, store.settings.title); toast.success("קובץ HTML נוצר!"); }}>
              <FileDown className="w-4 h-4 ml-1" />ייצוא HTML
            </Button>
            <Button size="sm" onClick={() => navigate("/host")}>
              <Play className="w-4 h-4 ml-1" />הפעלת משחק
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: play + hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <Button size="sm" className="h-8 px-3 text-xs gap-1" onClick={() => navigate("/host")}>
              <Play className="w-3.5 h-3.5" />הפעל
            </Button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-10" dir="rtl">
                <div className="space-y-1">
                  {user && <p className="text-xs text-muted-foreground px-3 pb-3 border-b mb-2">{user.email}</p>}
                  {[
                    { icon: Home, label: "דף הבית", action: () => navigate("/") },
                    { icon: Play, label: "הפעלת משחק", action: () => navigate("/host") },
                    { icon: HelpCircle, label: "הדרכה", action: () => setShowTutorial(true) },
                    { icon: FileDown, label: "ייצוא HTML", action: () => { exportStandaloneHTML(store.questions, store.settings.title); toast.success("קובץ HTML נוצר!"); } },
                  ].map(({ icon: Icon, label, action }) => (
                    <Button key={label} variant="ghost" className="w-full justify-start gap-3 h-10" onClick={() => { action(); setMenuOpen(false); }}>
                      <Icon className="w-4 h-4" />{label}
                    </Button>
                  ))}
                  <div className="pt-2 border-t">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive" onClick={signOut}>
                      <LogOut className="w-4 h-4" />יציאה
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop tab bar */}
      <div className="hidden md:flex border-b border-border bg-card px-4 gap-0.5 pt-1">
        {tabConfig.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px ${
              tab === id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === "questions" && (
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${tab === id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {store.questions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:pb-8 max-w-4xl mx-auto w-full">
        {tab === "questions" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <QuestionImportExport
                questions={store.questions}
                onImport={(imported) => store.updateQuestions([...store.questions, ...imported])}
                onReplace={(imported) => store.updateQuestions(imported)}
              />
            </div>
            <QuestionList questions={store.questions} onRemove={store.removeQuestion} onUpdate={store.updateQuestion} />
          </div>
        )}

        {tab === "add" && (
          <QuestionEditor onAdd={(q) => { store.addQuestion(q); toast.success("שאלה נוספה! 🎉"); setTab("questions"); }} />
        )}

        {tab === "players" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">ניהול שחקנים לפי משחקים</h2>
              <Button variant="outline" size="sm" onClick={fetchGamesWithPlayers} disabled={playersLoading}>
                <RefreshCw className={`w-4 h-4 ml-1 ${playersLoading ? "animate-spin" : ""}`} />רענן
              </Button>
            </div>
            {playersLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
            {!playersLoading && games.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>אין משחקים עדיין</p>
                <p className="text-sm mt-1">לחץ על "רענן" לטעינה</p>
              </div>
            )}
            {!playersLoading && games.map(g => (
              <GameCard key={g.id} game={g} onDeleteGame={handleDeleteGame} onDeletePlayer={handleDeletePlayer} />
            ))}
          </div>
        )}

        {tab === "settings" && (
          <GameSettingsPanel settings={store.settings} onUpdate={store.updateSettings} questions={store.questions} onResetQuestions={() => store.updateQuestions(defaultQuestions)} />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="grid grid-cols-4 px-1 py-1 pb-safe">
          {tabConfig.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all ${
                tab === id ? "text-primary" : "text-muted-foreground active:text-foreground"
              }`}
            >
              {tab === id && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <div className={`p-1.5 rounded-xl transition-colors ${tab === id ? "bg-primary/10" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {id === "questions" && (
                <span className={`absolute top-1 right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  tab === id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {store.questions.length > 99 ? "99+" : store.questions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <TutorialDialog open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

function GameCard({ game, onDeleteGame, onDeletePlayer }: { game: GameRow; onDeleteGame: (id: string) => void; onDeletePlayer: (id: string) => void; }) {
  const [open, setOpen] = useState(false);
  const statusLabel: Record<string, string> = { lobby: "לובי", playing: "פעיל", question: "פעיל", finished: "הסתיים" };
  const statusVariant: Record<string, "secondary" | "default" | "outline"> = { lobby: "secondary", playing: "default", question: "default", finished: "outline" };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-right" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-bold text-lg tracking-widest text-primary">{game.code}</span>
          <Badge variant={statusVariant[game.status] ?? "outline"} className="text-xs">{statusLabel[game.status] ?? game.status}</Badge>
          <span className="text-xs text-muted-foreground">{new Date(game.created_at).toLocaleString("he-IL")}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{game.players?.length ?? 0} שחקנים</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="flex justify-end px-4 py-2 bg-muted/20">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs gap-1" onClick={() => onDeleteGame(game.id)}>
              <Trash2 className="w-3.5 h-3.5" />מחק משחק
            </Button>
          </div>
          {game.players && game.players.length > 0 ? (
            <div className="divide-y divide-border/50">
              {game.players.map((player, idx) => (
                <div key={player.id} className={`flex items-center px-4 py-2.5 gap-3 ${idx === 0 ? "bg-yellow-50/40 dark:bg-yellow-900/10" : ""}`}>
                  <span className="w-6 text-center text-sm shrink-0">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-xs text-muted-foreground">{idx + 1}</span>}
                  </span>
                  <span className="flex-1 font-medium text-sm truncate">{player.name}</span>
                  <span className="font-mono text-sm text-primary font-bold">{player.score}</span>
                  <Badge variant={player.connected ? "default" : "outline"} className="text-xs hidden sm:flex">{player.connected ? "מחובר" : "מנותק"}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 shrink-0" onClick={() => onDeletePlayer(player.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground text-center">אין שחקנים במשחק זה</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;

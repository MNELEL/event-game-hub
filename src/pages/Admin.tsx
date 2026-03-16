import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { defaultQuestions } from "@/data/defaultQuestions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { QuestionEditor } from "@/components/game/QuestionEditor";
import { QuestionList } from "@/components/game/QuestionList";
import { GameSettingsPanel } from "@/components/game/GameSettingsPanel";
import { TutorialDialog } from "@/components/game/TutorialDialog";
import { QuestionImportExport } from "@/components/game/QuestionImportExport";
import { exportStandaloneHTML } from "@/utils/exportStandaloneHTML";
import { Play, HelpCircle, Settings, List, Plus, Home, LogOut, Loader2, FileDown, Users, Trash2, RefreshCw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type PlayerRow = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  created_at: string;
  game_id: string;
  game_code?: string;
};

type GameRow = {
  id: string;
  code: string;
  status: string;
  created_at: string;
  players?: PlayerRow[];
};

const Admin = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const store = useSupabaseQuestions();
  const [showTutorial, setShowTutorial] = useState(false);
  const [games, setGames] = useState<GameRow[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  const fetchGamesWithPlayers = async () => {
    setPlayersLoading(true);
    const { data: gamesData } = await supabase
      .from("games")
      .select("id, code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!gamesData) { setPlayersLoading(false); return; }

    const gamesWithPlayers = await Promise.all(
      gamesData.map(async (game) => {
        const { data: players } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", game.id)
          .order("score", { ascending: false });
        return { ...game, players: players || [] };
      })
    );
    setGames(gamesWithPlayers);
    setPlayersLoading(false);
  };

  const handleDeletePlayer = async (playerId: string) => {
    await supabase.from("players").delete().eq("id", playerId);
    toast.success("שחקן נמחק");
    fetchGamesWithPlayers();
  };

  const handleDeleteGame = async (gameId: string) => {
    await supabase.from("players").delete().eq("game_id", gameId);
    await supabase.from("games").delete().eq("id", gameId);
    toast.success("משחק ושחקניו נמחקו");
    fetchGamesWithPlayers();
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold text-foreground">🧠 מגה מוח - ממשק ניהול</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
              <HelpCircle className="w-4 h-4 ml-1" />
              הדרכה
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              exportStandaloneHTML(store.questions, store.settings.title);
              toast.success("קובץ HTML נוצר בהצלחה!");
            }}>
              <FileDown className="w-4 h-4 ml-1" />
              ייצוא HTML
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate("/host")}>
              <Play className="w-4 h-4 ml-1" />
              הפעלת משחק
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-1" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="questions" className="gap-2 font-display">
              <List className="w-4 h-4" />
              שאלות ({store.questions.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2 font-display">
              <Plus className="w-4 h-4" />
              הוספת שאלה
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2 font-display" onClick={fetchGamesWithPlayers}>
              <Users className="w-4 h-4" />
              שחקנים
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 font-display">
              <Settings className="w-4 h-4" />
              הגדרות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <div className="flex justify-end mb-4">
              <QuestionImportExport
                questions={store.questions}
                onImport={(imported) => store.updateQuestions([...store.questions, ...imported])}
                onReplace={(imported) => store.updateQuestions(imported)}
              />
            </div>
            <QuestionList
              questions={store.questions}
              onRemove={store.removeQuestion}
              onUpdate={store.updateQuestion}
            />
          </TabsContent>

          <TabsContent value="add">
            <QuestionEditor onAdd={store.addQuestion} />
          </TabsContent>

          <TabsContent value="players">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">ניהול שחקנים לפי משחקים</h2>
                <Button variant="outline" size="sm" onClick={fetchGamesWithPlayers} disabled={playersLoading}>
                  <RefreshCw className={`w-4 h-4 ml-1 ${playersLoading ? "animate-spin" : ""}`} />
                  רענן
                </Button>
              </div>

              {playersLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {!playersLoading && games.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>אין משחקים עדיין</p>
                  <p className="text-sm mt-1">לחץ על "רענן" לטעינה</p>
                </div>
              )}

              {!playersLoading && games.map(game => (
                <div key={game.id} className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg tracking-widest text-primary">{game.code}</span>
                      <Badge variant={game.status === "lobby" ? "secondary" : game.status === "finished" ? "outline" : "default"}>
                        {game.status === "lobby" ? "לובי" : game.status === "playing" || game.status === "question" ? "פעיל" : game.status === "finished" ? "הסתיים" : game.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(game.created_at).toLocaleString("he-IL")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteGame(game.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      מחק משחק
                    </Button>
                  </div>

                  {game.players && game.players.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-right">
                          <th className="px-4 py-2 font-medium">שם שחקן</th>
                          <th className="px-4 py-2 font-medium">ניקוד</th>
                          <th className="px-4 py-2 font-medium">סטטוס</th>
                          <th className="px-4 py-2 font-medium">פעולה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.players.map((player, idx) => (
                          <tr key={player.id} className={`border-b border-border/50 ${idx === 0 ? "bg-yellow-50/30" : ""}`}>
                            <td className="px-4 py-2 font-medium flex items-center gap-2">
                              {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                              {idx === 1 && <span className="text-base">🥈</span>}
                              {idx === 2 && <span className="text-base">🥉</span>}
                              {player.name}
                            </td>
                            <td className="px-4 py-2 font-mono">{player.score}</td>
                            <td className="px-4 py-2">
                              <Badge variant={player.connected ? "default" : "outline"} className="text-xs">
                                {player.connected ? "מחובר" : "מנותק"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-7 px-2"
                                onClick={() => handleDeletePlayer(player.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-4 text-sm text-muted-foreground">אין שחקנים במשחק זה</div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <GameSettingsPanel
              settings={store.settings}
              onUpdate={store.updateSettings}
              questions={store.questions}
              onResetQuestions={() => store.updateQuestions(defaultQuestions)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <TutorialDialog open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default Admin;

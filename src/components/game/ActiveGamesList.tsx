import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Clock, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

type GameRow = {
  id: string;
  code: string;
  status: string;
  created_at: string;
  current_question_index: number;
  question_ids: string[];
  settings: any;
  players_count?: number;
};

const statusLabels: Record<string, string> = {
  lobby: "ממתין",
  playing: "משחק",
  question: "שאלה",
  results: "תוצאות",
  leaderboard: "טבלת מובילים",
  finished: "הסתיים",
};

const statusColors: Record<string, string> = {
  lobby: "bg-blue-500/20 text-blue-700 border-blue-300",
  playing: "bg-green-500/20 text-green-700 border-green-300",
  question: "bg-green-500/20 text-green-700 border-green-300",
  results: "bg-amber-500/20 text-amber-700 border-amber-300",
  leaderboard: "bg-amber-500/20 text-amber-700 border-amber-300",
  finished: "bg-muted text-muted-foreground border-border",
};

export function ActiveGamesList() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: gamesData } = await supabase
      .from("games")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (gamesData) {
      // Load player counts
      const gameIds = gamesData.map(g => g.id);
      const { data: playersData } = await supabase
        .from("players")
        .select("game_id")
        .in("game_id", gameIds);

      const countMap: Record<string, number> = {};
      playersData?.forEach(p => {
        countMap[p.game_id] = (countMap[p.game_id] || 0) + 1;
      });

      setGames(gamesData.map(g => ({
        ...g,
        players_count: countMap[g.id] || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { loadGames(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("games").update({ status: "finished" }).eq("id", id);
    setGames(prev => prev.map(g => g.id === id ? { ...g, status: "finished" } : g));
    toast.success("המשחק סומן כהסתיים");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>אין משחקים עדיין. לחץ על "הפעלת משחק" כדי ליצור את הראשון!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map(game => {
        const isActive = game.status !== "finished";
        const date = new Date(game.created_at);
        const dateStr = date.toLocaleDateString("he-IL") + " " + date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
        const progress = game.question_ids.length > 0
          ? `${Math.min(game.current_question_index + 1, game.question_ids.length)}/${game.question_ids.length}`
          : "0/0";

        return (
          <div
            key={game.id}
            className={`rounded-lg border p-4 flex items-center justify-between gap-4 transition-colors ${
              isActive ? "bg-card border-border hover:border-primary/40" : "bg-muted/50 border-border/50"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-lg tracking-wider">{game.code}</span>
                <Badge variant="outline" className={statusColors[game.status] || ""}>
                  {statusLabels[game.status] || game.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {dateStr}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {game.players_count} שחקנים
                </span>
                <span>שאלה {progress}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/host?gameId=${game.id}`)}
                  className="gap-1"
                >
                  <Play className="w-4 h-4" />
                  המשך
                </Button>
              )}
              {game.status === "finished" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/host?gameId=${game.id}`)}
                  className="gap-1"
                >
                  צפייה
                </Button>
              )}
              {isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(game.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

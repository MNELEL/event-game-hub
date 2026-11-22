import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PhonePlayerRow = {
  phone: string;
  player_id: string;
  game_id: string;
  joined_in_lobby: boolean;
  created_at: string;
  last_question_index: number;
  last_answer_at: string | null;
  last_poll_at: string | null;
  last_seen_question_index: number | null;
};

export function usePhonePlayers(gameDbId: string | null) {
  const [rows, setRows] = useState<PhonePlayerRow[]>([]);

  useEffect(() => {
    if (!gameDbId) {
      setRows([]);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("phone_players")
        .select("*")
        .eq("game_id", gameDbId)
        .order("created_at", { ascending: true });
      if (data) setRows(data as PhonePlayerRow[]);
    };
    load();

    const channel = supabase
      .channel(`phone-players-${gameDbId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "phone_players", filter: `game_id=eq.${gameDbId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameDbId]);

  return rows;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type GameStatus = "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";

type PlayerGameState = {
  gameId: string | null;
  playerId: string | null;
  sessionToken: string | null;
  playerName: string;
  gameStatus: GameStatus;
  currentQuestionIndex: number;
  currentQuestionId: string | null;
  questionIds: string[];
  timeRemaining: number;
  questionCount: number;
  connected: boolean;
  answerSubmitted: boolean;
};

export function usePlayerGame() {
  const [state, setState] = useState<PlayerGameState>({
    gameId: null,
    playerId: null,
    sessionToken: null,
    playerName: "",
    gameStatus: "lobby",
    currentQuestionIndex: 0,
    currentQuestionId: null,
    questionIds: [],
    timeRemaining: 15,
    questionCount: 0,
    connected: false,
    answerSubmitted: false,
  });

  // Join a game by code
  const joinGame = useCallback(async (code: string, name: string) => {
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (!game) return { error: "משחק לא נמצא" };

    if (game.status === "finished") return { error: "המשחק כבר הסתיים" };

    const sessionToken = crypto.randomUUID();

    const { data: player, error } = await supabase
      .from("players")
      .insert({ game_id: game.id, name, session_token: sessionToken })
      .select()
      .single();

    if (error || !player) return { error: "שגיאה בהצטרפות" };

    const questionIds = (game.question_ids as string[]) || [];
    setState(prev => ({
      ...prev,
      gameId: game.id,
      playerId: player.id,
      sessionToken: sessionToken,
      playerName: name,
      gameStatus: game.status as GameStatus,
      currentQuestionIndex: game.current_question_index,
      currentQuestionId: questionIds[game.current_question_index] || null,
      questionIds,
      timeRemaining: game.time_remaining,
      questionCount: questionIds.length,
      connected: true,
      answerSubmitted: false,
    }));

    return { error: null };
  }, []);

  // Subscribe to game state changes
  useEffect(() => {
    if (!state.gameId) return;

    const channel = supabase
      .channel(`player-game-${state.gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${state.gameId}` },
        (payload) => {
          const game = payload.new;
          setState(prev => ({
            ...prev,
            gameStatus: game.status as GameStatus,
            currentQuestionIndex: game.current_question_index,
            currentQuestionId: prev.questionIds[game.current_question_index] || null,
            timeRemaining: game.time_remaining,
            // Reset answer submitted when new question starts
            answerSubmitted: game.status === "question" && game.current_question_index !== prev.currentQuestionIndex
              ? false
              : prev.answerSubmitted,
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.gameId]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: number, questionId: string, timeTaken: number) => {
    if (!state.gameId || !state.playerId || state.answerSubmitted) return;

    // Use server-side edge function for answer validation and scoring
    await supabase.functions.invoke("submit-answer", {
      body: {
        player_id: state.playerId,
        game_id: state.gameId,
        question_id: questionId,
        answer,
        time_taken: timeTaken,
        session_token: state.sessionToken,
      },
    });

    setState(prev => ({ ...prev, answerSubmitted: true }));
  }, [state.gameId, state.playerId, state.answerSubmitted]);

  return { state, joinGame, submitAnswer };
}

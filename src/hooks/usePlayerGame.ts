import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type GameStatus = "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";

type PlayerGameState = {
  gameId: string | null;
  playerId: string | null;
  playerName: string;
  secretToken: string | null;
  gameStatus: GameStatus;
  currentQuestionIndex: number;
  timeRemaining: number;
  questionCount: number;
  questionIds: string[];
  connected: boolean;
  answerSubmitted: boolean;
  startAt: string | null;
};

export function usePlayerGame() {
  const [state, setState] = useState<PlayerGameState>({
    gameId: null,
    playerId: null,
    playerName: "",
    secretToken: null,
    gameStatus: "lobby",
    currentQuestionIndex: 0,
    timeRemaining: 15,
    questionCount: 0,
    questionIds: [],
    connected: false,
    answerSubmitted: false,
    startAt: null,
  });

  // Join a game by code
  const joinGame = useCallback(async (code: string, name: string) => {
    const { data, error } = await (supabase as any).rpc("join_game_by_code", {
      p_code: code.toUpperCase(),
      p_name: name,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("game_not_found")) return { error: "משחק לא נמצא" };
      if (msg.includes("game_not_open")) return { error: "המשחק כבר התחיל או הסתיים" };
      if (msg.includes("invalid_name")) return { error: "שם לא תקין" };
      return { error: "שגיאה בהצטרפות" };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { error: "שגיאה בהצטרפות" };

    const questionIds = (row.question_ids as string[]) || [];

    setState(prev => ({
      ...prev,
      gameId: row.game_id,
      playerId: row.player_id,
      playerName: name,
      secretToken: row.secret_token,
      gameStatus: row.status as GameStatus,
      currentQuestionIndex: row.current_question_index,
      timeRemaining: row.time_remaining,
      questionCount: questionIds.length,
      questionIds,
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
          setState(prev => {
            const newQuestionIndex = game.current_question_index;
            const isNewQuestion = game.status === "question" && newQuestionIndex !== prev.currentQuestionIndex;
            return {
              ...prev,
              gameStatus: game.status as GameStatus,
              currentQuestionIndex: newQuestionIndex,
              timeRemaining: game.time_remaining,
              // Reset answer submitted when new question starts
              answerSubmitted: isNewQuestion ? false : prev.answerSubmitted,
            };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.gameId]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: number, timeTaken: number) => {
    if (!state.gameId || !state.playerId || !state.secretToken || state.answerSubmitted) return;

    const questionId = state.questionIds[state.currentQuestionIndex];
    if (!questionId) return;

    const actualTimeTaken = Math.max(0, timeTaken);

    await supabase.functions.invoke("submit-answer", {
      body: {
        player_id: state.playerId,
        game_id: state.gameId,
        question_id: questionId,
        answer,
        time_taken: actualTimeTaken,
        secret_token: state.secretToken,
      },
    });

    setState(prev => ({ ...prev, answerSubmitted: true }));
  }, [state.gameId, state.playerId, state.secretToken, state.answerSubmitted, state.questionIds, state.currentQuestionIndex]);

  return { state, joinGame, submitAnswer };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type GameStatus = "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";

type PlayerGameState = {
  gameId: string | null;
  playerId: string | null;
  sessionToken: string | null;
  playerName: string;
  secretToken: string | null;
  gameStatus: GameStatus;
  currentQuestionIndex: number;
  currentQuestionId: string | null;
  questionIds: string[];
  timeRemaining: number;
  questionCount: number;
  questionIds: string[];
  connected: boolean;
  answerSubmitted: boolean;
  startAt: string | null;
  playerScore: number;
  lastAnswerCorrect: boolean | null;
  lastPointsEarned: number;
};

export function usePlayerGame() {
  const [state, setState] = useState<PlayerGameState>({
    gameId: null,
    playerId: null,
    sessionToken: null,
    playerName: "",
    secretToken: null,
    gameStatus: "lobby",
    currentQuestionIndex: 0,
    currentQuestionId: null,
    questionIds: [],
    timeRemaining: 15,
    questionCount: 0,
    questionIds: [],
    connected: false,
    answerSubmitted: false,
    startAt: null,
    playerScore: 0,
    lastAnswerCorrect: null,
    lastPointsEarned: 0,
  });

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
    if (!game) return { error: "משחק לא נמצא" };
    if (game.status === "finished") return { error: "המשחק כבר הסתיים" };

    const sessionToken = crypto.randomUUID();
    const { data: player, error } = await supabase
      .from("players")
      .insert({ game_id: game.id, name, session_token: sessionToken })
      .select()
      .single();

    // Fetch start_at separately (not returned by RPC)
    const { data: gameRow } = await supabase
      .from("games")
      .select("start_at")
      .eq("id", row.game_id)
      .maybeSingle();

    const questionIds = (game.question_ids as string[]) || [];
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
      startAt: (gameRow as any)?.start_at ?? null,
      gameId: game.id,
      playerId: player.id,
      sessionToken,
      playerName: name,
      gameStatus: game.status as GameStatus,
      currentQuestionIndex: game.current_question_index,
      currentQuestionId: questionIds[game.current_question_index] || null,
      questionIds,
      timeRemaining: game.time_remaining,
      questionCount: questionIds.length,
      connected: true,
      answerSubmitted: false,
      playerScore: player.score || 0,
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
              startAt: game.start_at ?? prev.startAt,
              // Reset answer submitted when new question starts
              answerSubmitted: isNewQuestion ? false : prev.answerSubmitted,
            };
          });
            // Reset when: new question index arrives, OR entering "question" from another status
            const enteringQuestion =
              game.status === "question" &&
              (prev.gameStatus !== "question" ||
               game.current_question_index !== prev.currentQuestionIndex);

            return {
              ...prev,
              gameStatus: game.status as GameStatus,
              currentQuestionIndex: game.current_question_index,
              currentQuestionId: prev.questionIds[game.current_question_index] || null,
              timeRemaining: game.time_remaining,
              answerSubmitted: enteringQuestion ? false : prev.answerSubmitted,
              lastAnswerCorrect: enteringQuestion ? null : prev.lastAnswerCorrect,
              lastPointsEarned: enteringQuestion ? 0 : prev.lastPointsEarned,
            };
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.gameId]);

  // Subscribe to own player score changes
  useEffect(() => {
    if (!state.playerId) return;
    const channel = supabase
      .channel(`player-score-${state.playerId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players", filter: `id=eq.${state.playerId}` },
        (payload) => {
          setState(prev => ({
            ...prev,
            playerScore: payload.new.score ?? prev.playerScore,
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.playerId]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: number, timeTaken: number) => {
    if (!state.gameId || !state.playerId || !state.secretToken || state.answerSubmitted) return;

    const questionId = state.questionIds[state.currentQuestionIndex];
    if (!questionId) return;

    const actualTimeTaken = Math.max(0, timeTaken);

    await supabase.functions.invoke("submit-answer", {
  const submitAnswer = useCallback(async (
    answer: number,
    questionId: string,
    timeTaken: number
  ) => {
    if (!state.gameId || !state.playerId || state.answerSubmitted) return;
    setState(prev => ({ ...prev, answerSubmitted: true }));

    const { data } = await supabase.functions.invoke("submit-answer", {
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
        time_taken: timeTaken,
        session_token: state.sessionToken,
      },
    });

    if (data) {
      setState(prev => ({
        ...prev,
        lastAnswerCorrect: data.correct ?? null,
        lastPointsEarned: data.points_earned ?? 0,
        playerScore: data.correct
          ? prev.playerScore + (data.points_earned ?? 0)
          : prev.playerScore,
      }));
    }
  }, [state.gameId, state.playerId, state.answerSubmitted, state.sessionToken]);

  return { state, joinGame, submitAnswer };
}


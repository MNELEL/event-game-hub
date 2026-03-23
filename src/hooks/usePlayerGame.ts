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
    gameStatus: "lobby",
    currentQuestionIndex: 0,
    currentQuestionId: null,
    questionIds: [],
    timeRemaining: 15,
    questionCount: 0,
    connected: false,
    answerSubmitted: false,
    playerScore: 0,
    lastAnswerCorrect: null,
    lastPointsEarned: 0,
  });

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
          setState(prev => ({
            ...prev,
            gameStatus: game.status as GameStatus,
            currentQuestionIndex: game.current_question_index,
            currentQuestionId: prev.questionIds[game.current_question_index] || null,
            timeRemaining: game.time_remaining,
            answerSubmitted:
              game.status === "question" &&
              game.current_question_index !== prev.currentQuestionIndex
                ? false  // new question → reset
                : game.status !== "question"
                  ? false  // left question phase → reset
                  : prev.answerSubmitted,
            lastAnswerCorrect:
              game.status === "question" &&
              game.current_question_index !== prev.currentQuestionIndex
                ? null
                : game.status !== "question"
                  ? null
                  : prev.lastAnswerCorrect,
          }));
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


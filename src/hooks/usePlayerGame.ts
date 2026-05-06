import { useState, useEffect, useCallback, useRef } from "react";
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
  /** True when offline or realtime channel dropped — UI should show banner */
  disconnected: boolean;
  /** True while a reconnect attempt is in flight */
  reconnecting: boolean;
};

const SESSION_KEY = "player_session_v1";

type PersistedSession = {
  gameId: string;
  playerId: string;
  secretToken: string;
  playerName: string;
  code: string;
};

function saveSession(s: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

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
    disconnected: typeof navigator !== "undefined" && !navigator.onLine,
    reconnecting: false,
  });

  const lastCodeRef = useRef<string>("");
  const reconnectAttemptsRef = useRef(0);

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

    const { data: gameRow } = await supabase
      .from("games")
      .select("start_at")
      .eq("id", row.game_id)
      .maybeSingle();

    saveSession({
      gameId: row.game_id,
      playerId: row.player_id,
      secretToken: row.secret_token,
      playerName: name,
      code: code.toUpperCase(),
    });
    lastCodeRef.current = code.toUpperCase();

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
      disconnected: false,
      reconnecting: false,
    }));

    return { error: null };
  }, []);

  // Refetch latest game state without re-creating a player row.
  const refetchGameState = useCallback(async (gameId: string) => {
    const { data, error } = await supabase
      .from("games")
      .select("status, current_question_index, time_remaining, question_ids, start_at")
      .eq("id", gameId)
      .maybeSingle();
    if (error || !data) return false;
    const row = data as any;
    setState(prev => ({
      ...prev,
      gameStatus: row.status as GameStatus,
      currentQuestionIndex: row.current_question_index,
      timeRemaining: row.time_remaining,
      questionIds: row.question_ids || prev.questionIds,
      questionCount: (row.question_ids || prev.questionIds).length,
      startAt: row.start_at ?? prev.startAt,
      disconnected: false,
      reconnecting: false,
      connected: true,
    }));
    return true;
  }, []);

  // Try to restore a previous session on first mount.
  useEffect(() => {
    if (state.gameId) return;
    const saved = loadSession();
    if (!saved) return;
    lastCodeRef.current = saved.code;
    refetchGameState(saved.gameId).then(ok => {
      if (ok) {
        setState(prev => ({
          ...prev,
          gameId: saved.gameId,
          playerId: saved.playerId,
          playerName: saved.playerName,
          secretToken: saved.secretToken,
          connected: true,
        }));
      } else {
        clearSession();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual reconnect — refetch + re-subscribe by changing key (handled below).
  const reconnect = useCallback(async () => {
    const saved = loadSession();
    if (!saved) return false;
    setState(prev => ({ ...prev, reconnecting: true }));
    reconnectAttemptsRef.current += 1;
    const ok = await refetchGameState(saved.gameId);
    if (!ok) {
      setState(prev => ({ ...prev, reconnecting: false, disconnected: true }));
    }
    return ok;
  }, [refetchGameState]);

  // Subscribe to game state changes. Re-subscribes whenever gameId changes.
  useEffect(() => {
    if (!state.gameId) return;

    let cancelled = false;
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
              answerSubmitted: isNewQuestion ? false : prev.answerSubmitted,
              disconnected: false,
              connected: true,
            };
          });
        }
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setState(prev => ({ ...prev, disconnected: false, reconnecting: false, connected: true }));
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setState(prev => ({ ...prev, disconnected: true }));
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [state.gameId]);

  // Browser online/offline + automatic reconnect with exponential backoff.
  useEffect(() => {
    const goOffline = () => setState(prev => ({ ...prev, disconnected: true }));
    const goOnline = () => {
      setState(prev => ({ ...prev, disconnected: true, reconnecting: true }));
      reconnect();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [reconnect]);

  // Auto-retry while disconnected (max ~30s, capped backoff).
  useEffect(() => {
    if (!state.disconnected || !state.gameId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return; // wait for online event
    const attempt = Math.min(reconnectAttemptsRef.current, 5);
    const delay = Math.min(1000 * 2 ** attempt, 15000);
    const t = setTimeout(() => { reconnect(); }, delay);
    return () => clearTimeout(t);
  }, [state.disconnected, state.gameId, reconnect]);

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

  const leaveGame = useCallback(() => {
    clearSession();
    setState({
      gameId: null, playerId: null, playerName: "", secretToken: null,
      gameStatus: "lobby", currentQuestionIndex: 0, timeRemaining: 15,
      questionCount: 0, questionIds: [], connected: false, answerSubmitted: false,
      startAt: null, disconnected: false, reconnecting: false,
    });
  }, []);

  return { state, joinGame, submitAnswer, reconnect, leaveGame };
}

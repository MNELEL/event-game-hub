import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
const SNAPSHOT_KEY = "player_session_v1_snapshot";

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
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SNAPSHOT_KEY);
  } catch {}
}

function saveSnapshot(s: Partial<PlayerGameState>) {
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s)); } catch {}
}
function loadSnapshot(): Partial<PlayerGameState> | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

type PendingAnswer = {
  questionId: string;
  questionIndex: number;
  answer: number;
  timeTaken: number;
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
    disconnected: typeof navigator !== "undefined" && !navigator.onLine,
    reconnecting: false,
  });

  // Frozen snapshot to display while disconnected. Updated only from confirmed
  // server payloads (realtime UPDATE or successful refetch).
  const [snapshot, setSnapshot] = useState<Partial<PlayerGameState> | null>(() => loadSnapshot());

  const lastCodeRef = useRef<string>("");
  const reconnectAttemptsRef = useRef(0);
  const pendingAnswerRef = useRef<PendingAnswer | null>(null);

  // Persist a snapshot of the gameplay-relevant fields. Called only from
  // confirmed server updates so transient values never leak into the snapshot.
  const captureSnapshot = useCallback((s: PlayerGameState) => {
    const snap: Partial<PlayerGameState> = {
      gameStatus: s.gameStatus,
      currentQuestionIndex: s.currentQuestionIndex,
      timeRemaining: s.timeRemaining,
      questionCount: s.questionCount,
      questionIds: s.questionIds,
      answerSubmitted: s.answerSubmitted,
      startAt: s.startAt,
      playerName: s.playerName,
    };
    setSnapshot(snap);
    saveSnapshot(snap);
  }, []);

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

    setState(prev => {
      const next: PlayerGameState = {
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
      };
      captureSnapshot(next);
      return next;
    });

    return { error: null };
  }, [captureSnapshot]);

  // Refetch latest game state without re-creating a player row.
  const refetchGameState = useCallback(async (gameId: string) => {
    const { data, error } = await supabase
      .from("games")
      .select("status, current_question_index, time_remaining, question_ids, start_at")
      .eq("id", gameId)
      .maybeSingle();
    if (error || !data) return false;
    const row = data as any;
    setState(prev => {
      const next: PlayerGameState = {
        ...prev,
        gameStatus: row.status as GameStatus,
        currentQuestionIndex: row.current_question_index,
        timeRemaining: row.time_remaining,
        questionIds: row.question_ids || prev.questionIds,
        questionCount: (row.question_ids || prev.questionIds).length,
        startAt: row.start_at ?? prev.startAt,
        // If server moved past the question we had a pending answer for, clear answerSubmitted
        answerSubmitted:
          row.current_question_index !== prev.currentQuestionIndex
            ? false
            : prev.answerSubmitted,
        disconnected: false,
        reconnecting: false,
        connected: true,
      };
      captureSnapshot(next);
      return next;
    });
    return true;
  }, [captureSnapshot]);

  // Try to restore a previous session on first mount.
  useEffect(() => {
    if (state.gameId) return;
    const saved = loadSession();
    if (!saved) return;
    lastCodeRef.current = saved.code;
    // Hydrate from snapshot first so the UI doesn't flash the join form.
    const snap = loadSnapshot();
    setState(prev => ({
      ...prev,
      gameId: saved.gameId,
      playerId: saved.playerId,
      playerName: saved.playerName,
      secretToken: saved.secretToken,
      connected: true,
      gameStatus: (snap?.gameStatus as GameStatus) ?? prev.gameStatus,
      currentQuestionIndex: snap?.currentQuestionIndex ?? prev.currentQuestionIndex,
      timeRemaining: snap?.timeRemaining ?? prev.timeRemaining,
      questionIds: (snap?.questionIds as string[]) ?? prev.questionIds,
      questionCount: snap?.questionCount ?? prev.questionCount,
      startAt: (snap?.startAt as string | null) ?? prev.startAt,
      answerSubmitted: snap?.answerSubmitted ?? prev.answerSubmitted,
    }));
    refetchGameState(saved.gameId).then(ok => {
      if (!ok) clearSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush any queued offline answer once we're back online.
  const flushPendingAnswer = useCallback(async () => {
    const pending = pendingAnswerRef.current;
    if (!pending) return;
    if (!state.gameId || !state.playerId || !state.secretToken) return;
    // If the server is no longer on the same question, drop it silently.
    if (pending.questionIndex !== state.currentQuestionIndex) {
      pendingAnswerRef.current = null;
      return;
    }
    try {
      await supabase.functions.invoke("submit-answer", {
        body: {
          player_id: state.playerId,
          game_id: state.gameId,
          question_id: pending.questionId,
          answer: pending.answer,
          time_taken: pending.timeTaken,
          secret_token: state.secretToken,
        },
      });
      pendingAnswerRef.current = null;
    } catch {
      // leave queued for the next reconnect
    }
  }, [state.gameId, state.playerId, state.secretToken, state.currentQuestionIndex]);

  // Manual reconnect — refetch + re-subscribe by changing key (handled below).
  const reconnect = useCallback(async () => {
    const saved = loadSession();
    if (!saved) return false;
    setState(prev => ({ ...prev, reconnecting: true }));
    reconnectAttemptsRef.current += 1;
    const ok = await refetchGameState(saved.gameId);
    if (!ok) {
      setState(prev => ({ ...prev, reconnecting: false, disconnected: true }));
    } else {
      reconnectAttemptsRef.current = 0;
      flushPendingAnswer();
    }
    return ok;
  }, [refetchGameState, flushPendingAnswer]);

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
            const next: PlayerGameState = {
              ...prev,
              gameStatus: game.status as GameStatus,
              currentQuestionIndex: newQuestionIndex,
              timeRemaining: game.time_remaining,
              startAt: game.start_at ?? prev.startAt,
              answerSubmitted: isNewQuestion ? false : prev.answerSubmitted,
              disconnected: false,
              connected: true,
            };
            captureSnapshot(next);
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setState(prev => ({ ...prev, disconnected: false, reconnecting: false, connected: true }));
          flushPendingAnswer();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setState(prev => ({ ...prev, disconnected: true }));
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [state.gameId, captureSnapshot, flushPendingAnswer]);

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

  // Submit answer — works offline by queuing.
  const submitAnswer = useCallback(async (answer: number, timeTaken: number) => {
    if (!state.gameId || !state.playerId || !state.secretToken || state.answerSubmitted) return;

    const questionId = state.questionIds[state.currentQuestionIndex];
    if (!questionId) return;

    const actualTimeTaken = Math.max(0, timeTaken);

    // Optimistically mark as submitted so the player sees the confirmation
    // screen immediately and doesn't tap again.
    setState(prev => {
      const next = { ...prev, answerSubmitted: true };
      captureSnapshot(next);
      return next;
    });

    const isOffline =
      state.disconnected ||
      (typeof navigator !== "undefined" && !navigator.onLine);

    if (isOffline) {
      pendingAnswerRef.current = {
        questionId,
        questionIndex: state.currentQuestionIndex,
        answer,
        timeTaken: actualTimeTaken,
      };
      return;
    }

    try {
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
    } catch {
      // Queue for retry on reconnect.
      pendingAnswerRef.current = {
        questionId,
        questionIndex: state.currentQuestionIndex,
        answer,
        timeTaken: actualTimeTaken,
      };
    }
  }, [state.gameId, state.playerId, state.secretToken, state.answerSubmitted, state.questionIds, state.currentQuestionIndex, state.disconnected, captureSnapshot]);

  const leaveGame = useCallback(() => {
    clearSession();
    pendingAnswerRef.current = null;
    setSnapshot(null);
    setState({
      gameId: null, playerId: null, playerName: "", secretToken: null,
      gameStatus: "lobby", currentQuestionIndex: 0, timeRemaining: 15,
      questionCount: 0, questionIds: [], connected: false, answerSubmitted: false,
      startAt: null, disconnected: false, reconnecting: false,
    });
  }, []);

  // While disconnected, surface the frozen snapshot for gameplay-relevant
  // fields so the UI never flashes between screens. Connection-state and
  // identity fields stay live.
  const visibleState = useMemo<PlayerGameState>(() => {
    if (!state.disconnected || !snapshot) return state;
    return {
      ...state,
      gameStatus: (snapshot.gameStatus as GameStatus) ?? state.gameStatus,
      currentQuestionIndex: snapshot.currentQuestionIndex ?? state.currentQuestionIndex,
      timeRemaining: snapshot.timeRemaining ?? state.timeRemaining,
      questionCount: snapshot.questionCount ?? state.questionCount,
      questionIds: (snapshot.questionIds as string[]) ?? state.questionIds,
      answerSubmitted: snapshot.answerSubmitted ?? state.answerSubmitted,
      startAt: (snapshot.startAt as string | null) ?? state.startAt,
    };
  }, [state, snapshot]);

  return { state: visibleState, joinGame, submitAnswer, reconnect, leaveGame };
}

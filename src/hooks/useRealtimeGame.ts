import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameState, GameSettings, Question, Player } from "@/types/game";

const generateGameCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export function useRealtimeGame(questions: Question[], settings: GameSettings) {
  const [gameState, setGameState] = useState<GameState>({
    status: "lobby",
    currentQuestionIndex: 0,
    questions: [],
    players: [],
    settings,
    timeRemaining: settings.defaultTimeLimit,
    gameCode: generateGameCode(),
  });
  const [gameDbId, setGameDbId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to players joining in realtime
  useEffect(() => {
    if (!gameDbId) return;

    const channel = supabase
      .channel(`game-players-${gameDbId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `game_id=eq.${gameDbId}` },
        (payload) => {
          const newPlayer: Player = {
            id: payload.new.id,
            name: payload.new.name,
            score: payload.new.score,
            answers: [],
          };
          setGameState(prev => {
            if (prev.players.some(p => p.id === newPlayer.id)) return prev;
            return { ...prev, players: [...prev.players, newPlayer] };
          });
        }
      )
      .subscribe();

    // Also load existing players
    supabase.from("players").select("*").eq("game_id", gameDbId).then(({ data }) => {
      if (data) {
        const players: Player[] = data.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          answers: [],
        }));
        setGameState(prev => ({ ...prev, players }));
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [gameDbId]);

  // Subscribe to player answers in realtime
  useEffect(() => {
    if (!gameDbId || gameState.status !== "question") return;

    const channel = supabase
      .channel(`game-answers-${gameDbId}-${gameState.currentQuestionIndex}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_answers", filter: `game_id=eq.${gameDbId}` },
        (payload) => {
          const ans = payload.new;
          setGameState(prev => ({
            ...prev,
            players: prev.players.map(p =>
              p.id === ans.player_id
                ? {
                    ...p,
                    score: p.score + (ans.points_earned || 0),
                    answers: [...p.answers, {
                      questionId: ans.question_id,
                      answer: ans.answer,
                      correct: ans.correct,
                      time: ans.time_taken,
                    }],
                  }
                : p
            ),
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameDbId, gameState.status, gameState.currentQuestionIndex]);

  // Create game session in DB
  const createGame = useCallback(async () => {
    const code = generateGameCode();
    let gameQuestions = [...questions];
    if (settings.selectedCategories.length > 0) {
      gameQuestions = gameQuestions.filter(q => settings.selectedCategories.includes(q.category));
    }
    if (settings.shuffleQuestions) {
      gameQuestions.sort(() => Math.random() - 0.5);
    }
    gameQuestions = gameQuestions.slice(0, settings.questionsPerGame);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("games").insert({
      code,
      status: "lobby",
      settings: JSON.parse(JSON.stringify(settings)),
      question_ids: gameQuestions.map(q => q.id),
      created_by: user?.id || null,
    }).select().single();

    if (data) {
      setGameDbId(data.id);
      setGameState({
        status: "lobby",
        currentQuestionIndex: 0,
        questions: gameQuestions,
        players: [],
        settings,
        timeRemaining: gameQuestions[0]?.timeLimit || settings.defaultTimeLimit,
        gameCode: code,
      });
    }
    return data;
  }, [questions, settings]);

  // Update game status in DB
  const updateGameInDb = useCallback(async (status: string, questionIndex?: number) => {
    if (!gameDbId) return;
    const updates: any = { status };
    if (questionIndex !== undefined) updates.current_question_index = questionIndex;
    await supabase.from("games").update(updates).eq("id", gameDbId);
  }, [gameDbId]);

  const startGame = useCallback(async () => {
    await updateGameInDb("playing");
    setGameState(prev => ({ ...prev, status: "playing" }));
  }, [updateGameInDb]);

  const showQuestion = useCallback(async () => {
    const timeLimit = gameState.questions[gameState.currentQuestionIndex]?.timeLimit || 15;
    await updateGameInDb("question", gameState.currentQuestionIndex);
    
    // Also update time_remaining in DB for player sync
    if (gameDbId) {
      await supabase.from("games").update({
        status: "question",
        current_question_index: gameState.currentQuestionIndex,
        time_remaining: timeLimit,
      }).eq("id", gameDbId);
    }
    
    setGameState(prev => ({
      ...prev,
      status: "question",
      timeRemaining: timeLimit,
    }));
  }, [gameState.currentQuestionIndex, gameState.questions, gameDbId, updateGameInDb]);

  const showResults = useCallback(async () => {
    await updateGameInDb("results");
    setGameState(prev => ({ ...prev, status: "results" }));
  }, [updateGameInDb]);

  const showLeaderboard = useCallback(async () => {
    await updateGameInDb("leaderboard");
    setGameState(prev => ({ ...prev, status: "leaderboard" }));
  }, [updateGameInDb]);

  const nextQuestion = useCallback(async () => {
    setGameState(prev => {
      const nextIdx = prev.currentQuestionIndex + 1;
      if (nextIdx >= prev.questions.length) {
        updateGameInDb("finished");
        return { ...prev, status: "finished" };
      }
      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        timeRemaining: prev.questions[nextIdx].timeLimit,
      };
    });
  }, [updateGameInDb]);

  const tick = useCallback(() => {
    setGameState(prev => {
      if (prev.timeRemaining <= 0) return prev;
      const newTime = prev.timeRemaining - 1;
      // Update DB every 5 seconds for player sync
      if (gameDbId && newTime % 5 === 0) {
        supabase.from("games").update({ time_remaining: newTime }).eq("id", gameDbId);
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, [gameDbId]);

  const addPlayer = useCallback(async (name: string) => {
    if (!gameDbId) {
      // Fallback: add locally
      const player: Player = {
        id: Math.random().toString(36).substring(2, 10),
        name,
        score: 0,
        answers: [],
      };
      setGameState(prev => ({ ...prev, players: [...prev.players, player] }));
      return player;
    }
    
    const { data } = await supabase.from("players").insert({
      game_id: gameDbId,
      name,
    }).select().single();

    if (data) {
      return { id: data.id, name: data.name, score: 0, answers: [] } as Player;
    }
    return null;
  }, [gameDbId]);

  const resetGame = useCallback(async () => {
    if (gameDbId) {
      await supabase.from("games").update({ status: "finished" }).eq("id", gameDbId);
    }
    const code = generateGameCode();
    setGameDbId(null);
    setGameState({
      status: "lobby",
      currentQuestionIndex: 0,
      questions: [],
      players: [],
      settings,
      timeRemaining: settings.defaultTimeLimit,
      gameCode: code,
    });
  }, [gameDbId, settings]);

  return {
    gameState, setGameState, gameDbId,
    createGame, startGame, showQuestion, showResults, showLeaderboard,
    nextQuestion, tick, addPlayer, resetGame,
  };
}

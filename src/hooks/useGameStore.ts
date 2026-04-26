import { useState, useCallback } from "react";
import { GameState, GameSettings, Question, Player } from "@/types/game";
import { defaultQuestions } from "@/data/defaultQuestions";

const generateGameCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const defaultSettings: GameSettings = {
  title: "החגיגה של חיוש",
  questionsPerGame: 10,
  defaultTimeLimit: 15,
  selectedCategories: [],
  showLeaderboardAfterEach: true,
  shuffleQuestions: true,
};

const STORAGE_KEY = "hayoush_data";

function loadFromStorage(): { questions: Question[]; settings: GameSettings } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        questions: parsed.questions || defaultQuestions,
        settings: { ...defaultSettings, ...parsed.settings },
      };
    }
  } catch {}
  return { questions: defaultQuestions, settings: defaultSettings };
}

function saveToStorage(questions: Question[], settings: GameSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, settings }));
}

export function useGameStore() {
  const stored = loadFromStorage();
  const [questions, setQuestions] = useState<Question[]>(stored.questions);
  const [settings, setSettings] = useState<GameSettings>(stored.settings);
  const [gameState, setGameState] = useState<GameState>({
    status: "lobby",
    currentQuestionIndex: 0,
    questions: [],
    players: [],
    settings: stored.settings,
    timeRemaining: stored.settings.defaultTimeLimit,
    gameCode: generateGameCode(),
  });

  const updateQuestions = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions);
    saveToStorage(newQuestions, settings);
  }, [settings]);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveToStorage(questions, newSettings);
  }, [questions]);

  const addQuestion = useCallback((question: Question) => {
    const updated = [...questions, question];
    updateQuestions(updated);
  }, [questions, updateQuestions]);

  const removeQuestion = useCallback((id: string) => {
    updateQuestions(questions.filter(q => q.id !== id));
  }, [questions, updateQuestions]);

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    updateQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  }, [questions, updateQuestions]);

  const startGame = useCallback(() => {
    let gameQuestions = [...questions];
    if (settings.selectedCategories.length > 0) {
      gameQuestions = gameQuestions.filter(q => settings.selectedCategories.includes(q.category));
    }
    if (settings.shuffleQuestions) {
      gameQuestions.sort(() => Math.random() - 0.5);
    }
    gameQuestions = gameQuestions.slice(0, settings.questionsPerGame);

    setGameState({
      status: "playing",
      currentQuestionIndex: 0,
      questions: gameQuestions,
      players: [],
      settings,
      timeRemaining: gameQuestions[0]?.timeLimit || settings.defaultTimeLimit,
      gameCode: generateGameCode(),
    });
  }, [questions, settings]);

  const addPlayer = useCallback((name: string) => {
    const player: Player = {
      id: Math.random().toString(36).substring(2, 10),
      name,
      score: 0,
      answers: [],
    };
    setGameState(prev => ({ ...prev, players: [...prev.players, player] }));
    return player;
  }, []);

  const submitAnswer = useCallback((playerId: string, answer: number) => {
    setGameState(prev => {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      if (!currentQ) return prev;
      const correct = answer === currentQ.correctAnswer;
      const timeBonus = Math.floor(prev.timeRemaining / currentQ.timeLimit * currentQ.points);
      const points = correct ? timeBonus : 0;

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                score: p.score + points,
                answers: [...p.answers, {
                  questionId: currentQ.id,
                  answer,
                  correct,
                  time: currentQ.timeLimit - prev.timeRemaining,
                }],
              }
            : p
        ),
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setGameState(prev => {
      const nextIdx = prev.currentQuestionIndex + 1;
      if (nextIdx >= prev.questions.length) {
        return { ...prev, status: "finished" };
      }
      return {
        ...prev,
        status: "question",
        currentQuestionIndex: nextIdx,
        timeRemaining: prev.questions[nextIdx].timeLimit,
      };
    });
  }, []);

  const showQuestion = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: "question",
      timeRemaining: prev.questions[prev.currentQuestionIndex]?.timeLimit || 15,
    }));
  }, []);

  const showResults = useCallback(() => {
    setGameState(prev => ({ ...prev, status: "results" }));
  }, []);

  const showLeaderboard = useCallback(() => {
    setGameState(prev => ({ ...prev, status: "leaderboard" }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      status: "lobby",
      currentQuestionIndex: 0,
      questions: [],
      players: [],
      settings,
      timeRemaining: settings.defaultTimeLimit,
      gameCode: generateGameCode(),
    });
  }, [settings]);

  const tick = useCallback(() => {
    setGameState(prev => {
      if (prev.timeRemaining <= 0) return prev;
      return { ...prev, timeRemaining: prev.timeRemaining - 1 };
    });
  }, []);

  return {
    questions, settings, gameState,
    updateQuestions, updateSettings, addQuestion, removeQuestion, updateQuestion,
    startGame, addPlayer, submitAnswer, nextQuestion, showQuestion, showResults, showLeaderboard, resetGame, tick,
    setGameState,
  };
}

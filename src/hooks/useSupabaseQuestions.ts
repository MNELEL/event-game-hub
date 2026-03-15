import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, GameSettings } from "@/types/game";
import { defaultQuestions } from "@/data/defaultQuestions";

const CACHE_KEY = "megabrain_data";

function cacheToLocal(questions: Question[], settings: GameSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ questions, settings }));
  } catch {}
}

// Convert DB row to app Question type
function dbToQuestion(row: any): Question {
  return {
    id: row.id,
    type: (row.media_type === "none" || !row.media_type) ? "text" : row.media_type,
    category: row.category,
    text: row.text,
    options: Array.isArray(row.options) ? row.options : JSON.parse(row.options),
    correctAnswer: row.correct_answer,
    timeLimit: row.time_limit,
    points: row.points,
    mediaUrl: row.media_url || undefined,
  };
}

// Convert app Question to DB insert format
function questionToDb(q: Question, index: number) {
  return {
    id: q.id.length > 10 ? q.id : undefined, // only use UUID ids
    text: q.text,
    options: JSON.stringify(q.options),
    correct_answer: q.correctAnswer,
    category: q.category,
    time_limit: q.timeLimit,
    points: q.points,
    media_url: q.mediaUrl || null,
    media_type: q.type === "text" ? "none" : q.type,
    order_index: index,
  };
}

export function useSupabaseQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    title: "מגה מוח",
    questionsPerGame: 10,
    defaultTimeLimit: 15,
    selectedCategories: [],
    showLeaderboardAfterEach: true,
    shuffleQuestions: true,
  });
  const [loading, setLoading] = useState(true);

  // Load questions from DB
  const loadQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("order_index");
    
    if (!error && data && data.length > 0) {
      setQuestions(data.map(dbToQuestion));
    } else if (!error && (!data || data.length === 0)) {
      // Seed default questions if DB is empty
      await seedDefaultQuestions();
    }
  }, []);

  // Load settings from DB
  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("game_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      setSettings({
        title: data.title,
        questionsPerGame: data.questions_per_game,
        defaultTimeLimit: data.default_time_limit,
        selectedCategories: data.selected_categories || [],
        showLeaderboardAfterEach: data.show_leaderboard_after_each,
        shuffleQuestions: data.shuffle_questions,
      });
    }
  }, []);

  const seedDefaultQuestions = async () => {
    const rows = defaultQuestions.map((q, i) => questionToDb(q, i));
    // Remove id field so DB generates UUIDs
    const cleanRows = rows.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from("questions").insert(cleanRows);
    if (!error) {
      await loadQuestions();
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadQuestions(), loadSettings()]);
      setLoading(false);
    };
    init();
  }, [loadQuestions, loadSettings]);

  const addQuestion = useCallback(async (question: Question) => {
    const row = questionToDb(question, questions.length);
    const { id, ...rest } = row;
    const { data, error } = await supabase.from("questions").insert(rest).select().single();
    if (!error && data) {
      setQuestions(prev => [...prev, dbToQuestion(data)]);
    }
  }, [questions.length]);

  const removeQuestion = useCallback(async (questionId: string) => {
    await supabase.from("questions").delete().eq("id", questionId);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  const updateQuestion = useCallback(async (questionId: string, updates: Partial<Question>) => {
    const dbUpdates: any = {};
    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.options !== undefined) dbUpdates.options = JSON.stringify(updates.options);
    if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.timeLimit !== undefined) dbUpdates.time_limit = updates.timeLimit;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.mediaUrl !== undefined) dbUpdates.media_url = updates.mediaUrl;
    if (updates.type !== undefined) dbUpdates.media_type = updates.type === "text" ? "none" : updates.type;

    await supabase.from("questions").update(dbUpdates).eq("id", questionId);
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
  }, []);

  const updateQuestions = useCallback(async (newQuestions: Question[]) => {
    // Delete all and re-insert (for reset)
    await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const rows = newQuestions.map((q, i) => {
      const { id, ...rest } = questionToDb(q, i);
      return rest;
    });
    const { data } = await supabase.from("questions").insert(rows).select();
    if (data) {
      setQuestions(data.map(dbToQuestion));
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: GameSettings) => {
    const { data: existing } = await supabase.from("game_settings").select("id").limit(1).single();
    const dbSettings = {
      title: newSettings.title,
      questions_per_game: newSettings.questionsPerGame,
      default_time_limit: newSettings.defaultTimeLimit,
      selected_categories: newSettings.selectedCategories,
      show_leaderboard_after_each: newSettings.showLeaderboardAfterEach,
      shuffle_questions: newSettings.shuffleQuestions,
    };
    
    if (existing) {
      await supabase.from("game_settings").update(dbSettings).eq("id", existing.id);
    } else {
      await supabase.from("game_settings").insert(dbSettings);
    }
    setSettings(newSettings);
  }, []);

  return {
    questions, settings, loading,
    addQuestion, removeQuestion, updateQuestion, updateQuestions, updateSettings,
    loadQuestions,
  };
}

export type QuestionType = "text" | "image" | "audio" | "video";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  category: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0-3, or -1 for poll (no correct answer)
  mediaUrl?: string;
  timeLimit: number;
  points: number;
};

export type Player = {
  id: string;
  name: string;
  score: number;
  answers: { questionId: string; answer: number; correct: boolean; time: number }[];
};

export type GameSettings = {
  title: string;
  questionsPerGame: number;
  defaultTimeLimit: number;
  selectedCategories: string[];
  showLeaderboardAfterEach: boolean;
  shuffleQuestions: boolean;
};

export type GameState = {
  status: "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished";
  currentQuestionIndex: number;
  questions: Question[];
  players: Player[];
  settings: GameSettings;
  timeRemaining: number;
  gameCode: string;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "general",       name: "ידע כללי",        color: "hsl(250 70% 55%)" },
  { id: "science",       name: "מדע וטבע",         color: "hsl(170 70% 45%)" },
  { id: "history",       name: "היסטוריה",         color: "hsl(30 80% 50%)"  },
  { id: "geography",     name: "גיאוגרפיה",        color: "hsl(145 65% 42%)" },
  { id: "entertainment", name: "בידור ותרבות",      color: "hsl(330 70% 55%)" },
  { id: "sports",        name: "ספורט",            color: "hsl(200 80% 50%)" },
  { id: "food",          name: "אוכל ומטבח",        color: "hsl(15 85% 55%)"  },
  { id: "jewish",        name: "יהדות ומסורת",      color: "hsl(45 90% 50%)"  },
  { id: "passover",      name: "פסח",              color: "hsl(35 90% 52%)"  },
  { id: "family",        name: "משפחה",            color: "hsl(290 60% 55%)" },
  { id: "fun",           name: "שאלות כיף",         color: "hsl(350 80% 55%)" },
  { id: "poll",          name: "סקרים",            color: "hsl(205 75% 52%)" },
];

export type DemoQType = "text" | "image" | "video" | "boolean";

export interface DemoQuestion {
  qid: DemoQType;
  label: string;
  q: string;
  media?: { type: "image" | "video"; src: string; alt?: string };
  options: string[];
  correct: number;
}

export const DEFAULT_DEMO_QUESTIONS: DemoQuestion[] = [
  {
    qid: "text",
    label: "טקסט",
    q: "מהי בירת ישראל?",
    options: ["תל אביב", "ירושלים", "חיפה", "באר שבע"],
    correct: 1,
  },
  {
    qid: "image",
    label: "תמונה",
    q: "איזה מבנה מפורסם מופיע בתמונה?",
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=70",
      alt: "מבנה ידוע",
    },
    options: ["מגדל אייפל", "פירמידות גיזה", "כיפת הסלע", "טאג' מהאל"],
    correct: 3,
  },
  {
    qid: "video",
    label: "וידאו",
    q: "איזו פעילות מופיעה בסרטון?",
    media: {
      type: "video",
      src: "https://cdn.pixabay.com/video/2020/10/24/53029-471960532_tiny.mp4",
    },
    options: ["ריקוד", "ספורט", "בישול", "ציור"],
    correct: 0,
  },
  {
    qid: "boolean",
    label: "נכון/לא נכון",
    q: "החומה הסינית נראית מהחלל בעין רגילה",
    options: ["נכון", "לא נכון"],
    correct: 1,
  },
];

const STORAGE_KEY = "landing_demo_questions";
export const DEMO_UPDATED_EVENT = "demo-questions-updated";

export function loadDemoQuestions(): DemoQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_QUESTIONS;
    const parsed = JSON.parse(raw) as DemoQuestion[];
    if (!Array.isArray(parsed) || parsed.length !== 4) return DEFAULT_DEMO_QUESTIONS;
    // Ensure all 4 qids present, otherwise merge
    const merged = DEFAULT_DEMO_QUESTIONS.map(
      (def) => parsed.find((p) => p.qid === def.qid) || def
    );
    return merged;
  } catch {
    return DEFAULT_DEMO_QUESTIONS;
  }
}

export function saveDemoQuestions(questions: DemoQuestion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    window.dispatchEvent(new CustomEvent(DEMO_UPDATED_EVENT));
  } catch (e) {
    console.error("Failed to save demo questions", e);
  }
}

export function resetDemoQuestions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(DEMO_UPDATED_EVENT));
  } catch {}
}

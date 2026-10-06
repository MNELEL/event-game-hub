import type { Question } from "@/types/game";

type PackQ = Pick<Question, "text" | "options" | "correctAnswer"> & { difficulty?: Question["difficulty"] };

export type QuestionPack = { id: string; name: string; icon: string; description: string; questions: PackQ[] };

export const QUESTION_PACKS: QuestionPack[] = [
  {
    id: "wedding", name: "חתונה", icon: "💍", description: "מסורת, מנהגים ושאלות כיפיות על חתונות",
    questions: [
      { text: "מה שוברים בסוף החופה?", options: ["צלחת", "כוס", "בקבוק", "קערה"], correctAnswer: 1, difficulty: "easy" },
      { text: "כמה ברכות נאמרות בשבע ברכות?", options: ["5", "6", "7", "8"], correctAnswer: 2, difficulty: "easy" },
      { text: "איך נקרא החוזה שהחתן נותן לכלה?", options: ["כתובה", "שטר", "תנאים", "גט"], correctAnswer: 0, difficulty: "easy" },
      { text: "כמה ימים נמשכים ימי שבע ברכות?", options: ["3", "5", "7", "8"], correctAnswer: 2, difficulty: "easy" },
      { text: "באיזה חודש עברי לא נהוג להתחתן בין י\"ז בתמוז לט' באב?", options: ["חשוון", "אדר", "תמוז-אב", "ניסן"], correctAnswer: 2, difficulty: "medium" },
      { text: "מה שם הטקס שבו החתן מכסה את פני הכלה?", options: ["קבלת פנים", "הינומה (בדקן)", "יחוד", "שבע ברכות"], correctAnswer: 1, difficulty: "medium" },
    ],
  },
  {
    id: "family", name: "כנס משפחתי", icon: "👨‍👩‍👧‍👦", description: "שאלות שוברות קרח לכל הגילאים",
    questions: [
      { text: "כמה ימים יש בשנה מעוברת עברית בערך?", options: ["354", "365", "384", "400"], correctAnswer: 2, difficulty: "hard" },
      { text: "מי היו שלושת האבות?", options: ["אברהם, יצחק ויעקב", "משה, אהרן ומרים", "דוד, שלמה ושאול", "ראובן, שמעון ולוי"], correctAnswer: 0, difficulty: "easy" },
      { text: "איך קוראים לבן של הדוד שלי?", options: ["אחיין", "בן דוד", "גיס", "נכד"], correctAnswer: 1, difficulty: "easy" },
      { text: "מה הצבע של השמיים ביום בהיר?", options: ["ירוק", "כחול", "אדום", "צהוב"], correctAnswer: 1, difficulty: "easy" },
      { text: "איזה מאכל מסורתי אוכלים בשבת בבוקר?", options: ["חמין", "סופגניות", "מצה", "לביבות"], correctAnswer: 0, difficulty: "easy" },
      { text: "מה עיר הבירה של ישראל?", options: ["תל אביב", "חיפה", "ירושלים", "באר שבע"], correctAnswer: 2, difficulty: "easy" },
      { text: "כמה נכדים יש לסבא שיש לו 3 ילדים עם 2 ילדים כל אחד?", options: ["4", "5", "6", "8"], correctAnswer: 2, difficulty: "medium" },
    ],
  },
  {
    id: "birthday", name: "יום הולדת", icon: "🎂", description: "שאלות קלילות לחגיגת יום הולדת",
    questions: [
      { text: "מה נהוג לעשות לפני כיבוי הנרות?", options: ["לשיר", "לבקש משאלה", "לרקוד", "לצלם"], correctAnswer: 1, difficulty: "easy" },
      { text: "באיזה גיל חוגגים בת מצווה?", options: ["10", "12", "13", "15"], correctAnswer: 1, difficulty: "easy" },
      { text: "מה המילה החסרה: \"היום יום הולדת, היום יום ___\"?", options: ["שמח", "הולדת", "חג", "מיוחד"], correctAnswer: 1, difficulty: "easy" },
      { text: "כמה שנים בעשור?", options: ["5", "10", "20", "100"], correctAnswer: 1, difficulty: "easy" },
      { text: "איך נקרא יום הולדת 50 לנישואין?", options: ["חתונת כסף", "חתונת זהב", "חתונת יהלום", "חתונת פנינה"], correctAnswer: 1, difficulty: "medium" },
    ],
  },
  {
    id: "simcha", name: "בר / בת מצווה ושמחות", icon: "🎉", description: "מנהגים ומסורת של שמחות",
    questions: [
      { text: "באיזה גיל חוגגים בר מצווה?", options: ["12", "13", "14", "18"], correctAnswer: 1, difficulty: "easy" },
      { text: "מה עולה בר המצווה לקרוא בבית הכנסת?", options: ["מגילה", "תורה", "תהילים", "הגדה"], correctAnswer: 1, difficulty: "easy" },
      { text: "מה זורקים על חתן בר מצווה בבית הכנסת?", options: ["אורז", "סוכריות", "פרחים", "מטבעות"], correctAnswer: 1, difficulty: "easy" },
      { text: "מה מניחים בר מצווה כל בוקר?", options: ["טלית קטן", "תפילין", "כיפה", "ציצית"], correctAnswer: 1, difficulty: "medium" },
      { text: "מה פירוש המילה \"מזל טוב\"?", options: ["בהצלחה", "ברכה לשמחה", "תודה", "שלום"], correctAnswer: 1, difficulty: "easy" },
    ],
  },
];

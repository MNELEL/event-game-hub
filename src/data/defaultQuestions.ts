import { Question } from "@/types/game";

export const defaultQuestions: Question[] = [
  // ידע כללי
  { id: "g1", type: "text", category: "general", text: "מהי בירת צרפת?", options: ["לונדון", "פריז", "ברלין", "מדריד"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "g2", type: "text", category: "general", text: "כמה ימים יש בשנה מעוברת?", options: ["365", "366", "364", "367"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "g3", type: "text", category: "general", text: "מה הצבע שמתקבל מערבוב אדום וצהוב?", options: ["ירוק", "סגול", "כתום", "חום"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "g4", type: "text", category: "general", text: "כמה שחקנים יש בקבוצת כדורגל?", options: ["9", "10", "11", "12"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "g5", type: "text", category: "general", text: "מהי היבשת הגדולה בעולם?", options: ["אפריקה", "אירופה", "אסיה", "אמריקה"], correctAnswer: 2, timeLimit: 15, points: 100 },

  // מדע וטבע
  { id: "s1", type: "text", category: "science", text: "מהו היסוד הכימי הנפוץ ביותר ביקום?", options: ["חמצן", "מימן", "פחמן", "הליום"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "s2", type: "text", category: "science", text: "כמה עצמות יש בגוף האדם הבוגר?", options: ["186", "206", "226", "256"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "s3", type: "text", category: "science", text: "מה מהירות האור בקירוב?", options: ["100,000 קמ\"ש", "300,000 קמ\"ש", "300,000 ק\"מ לשנייה", "100,000 ק\"מ לשנייה"], correctAnswer: 2, timeLimit: 20, points: 150 },
  { id: "s4", type: "text", category: "science", text: "איזה כוכב לכת הוא הגדול במערכת השמש?", options: ["שבתאי", "צדק", "אורנוס", "נפטון"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "s5", type: "text", category: "science", text: "מה החיה המהירה ביותר בעולם?", options: ["אריה", "ברדלס", "נשר", "דולפין"], correctAnswer: 1, timeLimit: 15, points: 100 },

  // היסטוריה
  { id: "h1", type: "text", category: "history", text: "באיזו שנה הוכרזה מדינת ישראל?", options: ["1945", "1947", "1948", "1950"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "h2", type: "text", category: "history", text: "מי היה נשיא ארה\"ב הראשון?", options: ["תומאס ג'פרסון", "ג'ורג' וושינגטון", "אברהם לינקולן", "בנג'מין פרנקלין"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "h3", type: "text", category: "history", text: "באיזו שנה נפלה חומת ברלין?", options: ["1987", "1989", "1991", "1993"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "h4", type: "text", category: "history", text: "מי בנה את הפירמידות הגדולות?", options: ["הרומאים", "היוונים", "המצרים", "הפרסים"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "h5", type: "text", category: "history", text: "מתי הסתיימה מלחמת העולם השנייה?", options: ["1943", "1944", "1945", "1946"], correctAnswer: 2, timeLimit: 15, points: 100 },

  // גיאוגרפיה
  { id: "geo1", type: "text", category: "geography", text: "מהו ההר הגבוה בעולם?", options: ["קילימנג'רו", "אוורסט", "מון בלאן", "K2"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "geo2", type: "text", category: "geography", text: "מהו הנהר הארוך בעולם?", options: ["הנילוס", "האמזונס", "המיסיסיפי", "היאנגצה"], correctAnswer: 0, timeLimit: 15, points: 100 },
  { id: "geo3", type: "text", category: "geography", text: "באיזו מדינה נמצאת מגדל אייפל?", options: ["אנגליה", "איטליה", "צרפת", "ספרד"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "geo4", type: "text", category: "geography", text: "מהי המדינה הקטנה ביותר בעולם?", options: ["מונקו", "ותיקן", "סן מרינו", "ליכטנשטיין"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "geo5", type: "text", category: "geography", text: "כמה יבשות יש בעולם?", options: ["5", "6", "7", "8"], correctAnswer: 2, timeLimit: 10, points: 50 },

  // בידור ותרבות
  { id: "e1", type: "text", category: "entertainment", text: "מי כתב את 'הנסיך הקטן'?", options: ["ויקטור הוגו", "סנט-אקזופרי", "ז'ול ורן", "אלכסנדר דיומא"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "e2", type: "text", category: "entertainment", text: "באיזו שנה יצא הסרט 'טיטאניק'?", options: ["1995", "1997", "1999", "2001"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "e3", type: "text", category: "entertainment", text: "מי ציירה את 'מונה ליזה'?", options: ["מיכלאנג'לו", "רפאל", "לאונרדו דה וינצ'י", "בוטיצ'לי"], correctAnswer: 2, timeLimit: 15, points: 100 },

  // ספורט
  { id: "sp1", type: "text", category: "sports", text: "באיזו מדינה המציאו את הכדורגל המודרני?", options: ["ברזיל", "אנגליה", "ספרד", "איטליה"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "sp2", type: "text", category: "sports", text: "כמה טבעות יש בסמל האולימפי?", options: ["3", "4", "5", "6"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "sp3", type: "text", category: "sports", text: "מי זכה הכי הרבה פעמים במונדיאל?", options: ["ארגנטינה", "גרמניה", "ברזיל", "איטליה"], correctAnswer: 2, timeLimit: 15, points: 100 },

  // אוכל ומטבח
  { id: "f1", type: "text", category: "food", text: "מהי המדינה ממנה מגיעה הפיצה?", options: ["צרפת", "יוון", "איטליה", "ספרד"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "f2", type: "text", category: "food", text: "מהו התבלין היקר בעולם?", options: ["וניל", "זעפרן", "קינמון", "כורכום"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "f3", type: "text", category: "food", text: "מאיזה פרי מכינים גואקמולי?", options: ["עגבנייה", "אבוקדו", "מנגו", "לימון"], correctAnswer: 1, timeLimit: 10, points: 50 },

  // יהדות ומסורת
  { id: "j1", type: "text", category: "jewish", text: "כמה ספרים יש בתורה?", options: ["3", "4", "5", "6"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "j2", type: "text", category: "jewish", text: "באיזה חג אוכלים מצות?", options: ["סוכות", "פסח", "שבועות", "פורים"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "j3", type: "text", category: "jewish", text: "כמה שבטים היו בעם ישראל?", options: ["10", "12", "13", "7"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "j4", type: "text", category: "jewish", text: "מי הוביל את עם ישראל ביציאת מצרים?", options: ["אברהם", "יעקב", "משה", "דוד"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "j5", type: "text", category: "jewish", text: "כמה נרות מדליקים בסך הכל בחנוכה?", options: ["36", "44", "8", "64"], correctAnswer: 0, timeLimit: 20, points: 150 },

  // שאלות כיף
  { id: "fun1", type: "text", category: "fun", text: "מה צבעו של דוב הקוטב?", options: ["לבן", "שחור", "חום", "אפור"], correctAnswer: 0, timeLimit: 10, points: 50 },
  { id: "fun2", type: "text", category: "fun", text: "כמה רגליים יש לעכביש?", options: ["6", "8", "10", "12"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "fun3", type: "text", category: "fun", text: "מהו החיה שנקראת 'ספינת המדבר'?", options: ["סוס", "חמור", "גמל", "לאמה"], correctAnswer: 2, timeLimit: 15, points: 100 },
];

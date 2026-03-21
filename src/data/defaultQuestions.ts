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

  // פסח ויציאת מצרים
  { id: "pa1",  type: "text", category: "passover", text: "כמה כוסות יין שותים בליל הסדר?", options: ["שתיים", "שלוש", "ארבע", "חמש"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa2",  type: "text", category: "passover", text: "מה שם הספר שקוראים ממנו בסדר פסח?", options: ["הסידור", "ההגדה", "המחזור", "הזוהר"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "pa3",  type: "text", category: "passover", text: "מה מסתירים הילדים בסדר כדי לקבל מתנה?", options: ["כוס של אליהו", "הכרמל", "האפיקומן", "הכרפס"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa4",  type: "text", category: "passover", text: "כמה מכות ירדו על פרעה ועמו?", options: ["שבע", "שמונה", "עשר", "שתים עשרה"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa5",  type: "text", category: "passover", text: "מה אסור לאכול בפסח?", options: ["ירקות", "גבינה", "חמץ", "בשר"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa6",  type: "text", category: "passover", text: "כמה בנים מוזכרים בהגדת פסח?", options: ["שניים", "שלושה", "ארבעה", "חמישה"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa7",  type: "text", category: "passover", text: "כמה שלבים יש ב'סדר' של פסח?", options: ["עשרה", "שנים עשר", "חמישה עשר", "שמונה עשר"], correctAnswer: 2, timeLimit: 20, points: 150 },
  { id: "pa8",  type: "text", category: "passover", text: "מה מסמל החרוסת על קערת הסדר?", options: ["את הדם על המשקוף", "את הטיט שעבדו בו בני ישראל", "את ים סוף", "את פירות ארץ ישראל"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa9",  type: "text", category: "passover", text: "מה הוא האפיקומן?", options: ["שיר מיוחד בסוף ההגדה", "חתיכת מצה שמסתירים ואוכלים בסוף הסדר", "הכוס הרביעית", "ברכה אחרונה"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa10", type: "text", category: "passover", text: "מי שותה מהכוס המיוחדת שמוזגים לכבודו בסדר?", options: ["הרב של השכונה", "אליהו הנביא", "משה רבנו", "הבן הגדול"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "pa11", type: "text", category: "passover", text: "כמה ימים חל פסח בארץ ישראל?", options: ["שישה", "שבעה", "שמונה", "תשעה"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa12", type: "text", category: "passover", text: "מה הסיבה לאכילת מצה בפסח?", options: ["כי המצה טעימה יותר מלחם", "כי הבצק לא הספיק להחמיץ ביציאת מצרים", "כי הלחם התייקר במצרים", "כי פרעה ציוה על כך"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa13", type: "text", category: "passover", text: "מי שואל את שאלות 'מה נשתנה' בסדר?", options: ["האב", "הרב", "הקטן שבשולחן", "כולם ביחד בקול רם"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "pa14", type: "text", category: "passover", text: "מה הוא 'כרפס' על קערת הסדר?", options: ["ירק שטובלים במים מלוחים", "מין מרור", "מאכל מתוק מיוחד", "סוג של אפיקומן"], correctAnswer: 0, timeLimit: 15, points: 100 },
  { id: "pa15", type: "text", category: "passover", text: "מה עושים ב'בדיקת חמץ'?", options: ["בודקים מחירים בסופר לקראת החג", "מחפשים חמץ לאור נר בלילה שלפני פסח", "בודקים שהמצות כשרות לפסח", "בודקים שההגדה שלמה"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa16", type: "text", category: "passover", text: "מה הייתה המכה הראשונה על מצרים?", options: ["חושך", "צפרדע", "דם", "כינים"], correctAnswer: 2, timeLimit: 20, points: 150 },
  { id: "pa17", type: "text", category: "passover", text: "מה הייתה המכה האחרונה שגרמה ליציאת מצרים?", options: ["מכת חושך", "מכת ברד", "מכת ארבה", "מכת בכורות"], correctAnswer: 3, timeLimit: 15, points: 100 },
  { id: "pa18", type: "text", category: "passover", text: "באיזה חודש עברי חל חג הפסח?", options: ["אדר", "ניסן", "אייר", "סיוון"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "pa19", type: "text", category: "passover", text: "מה הוא 'מגיד' בסדר פסח?", options: ["שיר מיוחד שאומרים", "חלק סיפור יציאת מצרים", "הסעודה עצמה", "ברכת המזון"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa20", type: "text", category: "passover", text: "כמה מצות מניחים על קערת הסדר?", options: ["אחת", "שתיים", "שלוש", "ארבע"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "pa21", type: "text", category: "passover", text: "מה 'שולחן עורך' בסדר פסח?", options: ["עורך-הדין של הסדר", "הסעודה עצמה", "השולחן המיוחד לקערה", "ניגון מיוחד לפני האוכל"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa22", type: "text", category: "passover", text: "מה עושים עם החמץ לפני פסח?", options: ["מחביאים אותו מאחורי הספות", "מוכרים אותו לגוי ו/או שורפים אותו", "נותנים לשכנים לשמור", "זורקים לים"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa23", type: "text", category: "passover", text: "מה שם השיר שסופר בו מספר 1 עד 13?", options: ["דיינו", "חד גדיא", "אחד מי יודע", "הלל הגדול"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "pa24", type: "text", category: "passover", text: "כמה בתים יש בשיר 'דיינו'?", options: ["10", "13", "15", "18"], correctAnswer: 2, timeLimit: 20, points: 150 },
  { id: "pa25", type: "text", category: "passover", text: "מה מסמל המרור שאוכלים בסדר?", options: ["את המתיקות של ארץ כנען", "את מרירות העבדות במצרים", "את האוכל הרע שאכלו במדבר", "את צמחי הנילוס"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa26", type: "text", category: "passover", text: "כמה שנה הלכו בני ישראל במדבר?", options: ["עשרים", "שלושים", "ארבעים", "חמישים"], correctAnswer: 2, timeLimit: 15, points: 100 },
  { id: "pa27", type: "text", category: "passover", text: "מה היא 'ספירת העומר' שמתחילה בפסח?", options: ["ספירה של 49 יום עד חג השבועות", "ספירה של העומרות שאוספים בשדה", "ספירה של עשרת המכות מחדש", "ספירה של כוסות היין שנשארו"], correctAnswer: 0, timeLimit: 20, points: 150 },
  { id: "pa28", type: "text", category: "passover", text: "מה 'הלל' בסדר פסח?", options: ["שם של אורח שהוזמן לסדר", "פרקי שירה ותהלים שאומרים בסדר", "מאכל מיוחד לפסח", "שם של מלאך שמגיע עם אליהו"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa29", type: "text", category: "passover", text: "מה ה'זרוע' שמניחים על קערת הסדר?", options: ["זרועו של פרעה כזכרון", "עצם צלויה לזכר קרבן פסח", "מין מרור מיוחד", "יד שעשויה מבצק מצה"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa30", type: "text", category: "passover", text: "מה מסמלת הביצה על קערת הסדר?", options: ["ארוחת הבוקר של ליל הסדר", "קרבן חגיגה וזכר לחורבן הבית", "את הביצים שאכלו ישראל במדבר", "את קשיות לבו של פרעה"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa31", type: "text", category: "passover", text: "מה הבן הרשע אומר שמוציא אותו מהכלל?", options: ["'אני לא יודע לשאול'", "'מה העבודה הזאת לכם' - לכם ולא לו", "'מדוע אנחנו כאן?'", "'מתי אוכלים?'"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa32", type: "text", category: "passover", text: "מה המשמעות של המילה 'פסח'?", options: ["יציאה ממצרים", "ה' פסח על בתי ישראל בעת מכת בכורות", "שם של קרבן", "חג האביב"], correctAnswer: 1, timeLimit: 20, points: 150 },
  { id: "pa33", type: "text", category: "passover", text: "מה 'כוס של אליהו' שמניחים בסדר?", options: ["כוס שאליהו שותה כשפותחים את הדלת", "כוס יין לכבוד אליהו הנביא", "הכוס הגדולה ביותר על השולחן", "כוס מים קדושים"], correctAnswer: 1, timeLimit: 15, points: 100 },
  { id: "pa34", type: "text", category: "passover", text: "מה שם המצווה שתיקן הלל הזקן לאכול מצה, מרור וקרבן פסח יחד?", options: ["כרפס", "כריכה (כורך)", "חזרת", "מגיד"], correctAnswer: 1, timeLimit: 20, points: 150 },

  // כיף - פסח
  { id: "paf1", type: "text", category: "fun", text: "מה הסיבה האמיתית שהילדים אוהבים לגנוב את האפיקומן?", options: ["כי הם רוצים מצה נוספת", "כי מקבלים מתנה בתמורה", "כי כתוב בהגדה שצריך לגנוב", "כי הם סתם רעבים"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "paf2", type: "text", category: "fun", text: "כמה זמן בדרך כלל נמשך סדר פסח בבית חרדי?", options: ["חצי שעה בדיוק", "שעה וגמרנו", "שעתיים עד ארבע שעות", "שואלים את הרב"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "paf3", type: "text", category: "fun", text: "מה קורה לאבא לעיתים קרובות בשלב 'שולחן עורך'?", options: ["מנגן ניגון מרגש", "מתנמנם קצת מהיין", "מסביר הלכות פסח", "בורח למטבח לעזור לאמא"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "paf4", type: "text", category: "fun", text: "מה הדבר שהאמא עמלה עליו הכי הרבה לפני פסח?", options: ["קניית שמלה חדשה לחג", "ניקיון פסח", "לימוד ההגדה בעיון", "הכנת ההגדות לשולחן"], correctAnswer: 1, timeLimit: 10, points: 50 },
  { id: "paf5", type: "text", category: "fun", text: "מה הדבר הראשון שרוצים לאכול מיד לאחר פסח?", options: ["סלט ירקות", "מרק עוף", "פיצה או לחם טרי", "עוד מצה"], correctAnswer: 2, timeLimit: 10, points: 50 },
  { id: "paf6", type: "text", category: "fun", text: "כמה דקות לוקח לאבא להסביר לילדים מדוע לא ניתן לאכול את האפיקומן לפני הזמן?", options: ["שתי דקות בדיוק", "עשר דקות עם דוגמאות מהגמרא", "לא מסביר - פשוט אומר 'לא'", "שואל את הרב"], correctAnswer: 1, timeLimit: 10, points: 50 },
];

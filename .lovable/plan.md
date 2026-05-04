השתמש במספר מפתח ipi שכבר הזנתי לך שם במערכת כדי להגדיר את כל השלוחות לפי איך שמתאים שהם צריכים להיות בשביל שהמשחק יעבוד כרגע כשמתקשרים שומעים הגעת לטריוויה וזהו וזה לא מתחבר למשחק עצמו תגדיר את השלוחות ואת המקשים כך שברגע שמתקשרים המשחק ירוץ

## מטרה

להוסיף למארח שלושה כלים שיעזרו לוודא שמערכת ה-IVR עובדת נכון, במיוחד תרחישי "late joiner" ו-Recovery בשאלה הראשונה:

1. **לוח בקרה Live** למארח עם מצב משחק, שאלה נוכחית ופירוט מתקשרי IVR (כולל מי "שוחזר").
2. **תיעוד עברי מסודר** של כל ההודעות וההתנהגות של ה-IVR בתרחישי הצטרפות מאוחרת ומעבר בין שאלות.
3. **כפתור "בדיקת חיוג"** בממשק המארח שמדמה שיחת IVR ממספר דמה ומציג את התגובה שהמתקשר היה שומע.

---

## 1. לוח בקרה Live למארח (Live Status Panel)

קומפוננטה חדשה: `src/components/game/HostLiveStatusPanel.tsx`

מציגה בכל זמן (לא רק בלובי):

- **סטטוס משחק** עם תרגום עברי (`לובי` / `שאלה X מתוך Y` / `תוצאות` / `טבלת מובילים` / `סיום`).
- **שאלה נוכחית** — טקסט קצר + טיימר.
- **שחקנים מחוברים** — סך המסך + סך הטלפון.
- **פירוט מתקשרי IVR** מקובץ ל-3 קבוצות:
  - **רגילים** — `joined_in_lobby=true` והצטרפו לפני `start_at`.
  - **שוחזרו (Recovery)** — `joined_in_lobby=true` אבל `created_at` אחרי `start_at` (כלומר נכנסו בחלון 15 השניות הראשונות) — סימון מיוחד עם תג "שוחזר ✓".
  - **מאוחרים (Late)** — `joined_in_lobby=false`, ימתינו למשחק הבא.
  - לכל מתקשר: 4 ספרות אחרונות, מצב סנכרון IVR (משימוש קיים ב-`getCallerSyncState`), שאלה אחרונה שנענתה.

הפאנל מוצמד לצד שמאל (collapsible drawer) ויהיה זמין בכל שלבי המשחק. משתמש ב-`usePhonePlayers` הקיים ובמצב המשחק מ-`useRealtimeGame`.

זיהוי "Recovery" יחושב בצד הלקוח: `joined_in_lobby && created_at > start_at`. נשלוף `start_at` מתוך הטעינה הקיימת ב-`GameHost.tsx`.

שילוב ב-`src/pages/GameHost.tsx`: הוספה לצד `IvrSyncIndicator` בסרגל העליון או כ-drawer נפתח.

---

## 2. תיעוד עברי של הודעות IVR

קובץ חדש: `docs/IVR_HEBREW_GUIDE.md` (עברית, RTL).

תוכן:

- **טבלת תרחישים** — לכל שילוב של `game.status` × `joined_in_lobby` × `current_question_index`, מה ההודעה שהמתקשר ישמע ומה ההתנהגות הצפויה.
- **תרחישי Late Joiner**:
  - חיוג כשאין משחק פעיל.
  - חיוג בלובי לפני שהמארח לחץ "הפעלה".
  - חיוג בחלון Grace (אחרי "הפעלה" אבל לפני `start_at`).
  - חיוג בשאלה הראשונה תוך 15 שניות (Recovery — מותר לענות).
  - חיוג בשאלה הראשונה אחרי 15 שניות (Late — להמתין למשחק הבא).
  - חיוג באמצע משחק (שאלה 2+).
- **תרחישי מעבר בין שאלות**:
  - מעבר משאלה לתוצאות (Polling, מתי המתקשר שומע "השאלה הסתיימה").
  - מעבר מתוצאות ללוח מובילים.
  - מעבר לשאלה הבאה (איך ה-IVR מציג את השאלה החדשה ומקבל תשובה 1-4).
  - מעבר לסיום המשחק.
- **ציטוטים מדויקים בעברית** של כל הודעה (יש לחלץ מתוך `supabase/functions/yemot-ivr/logic.ts`).
- **דיאגרמת זרימה ב-ASCII** של החלטות ה-IVR.
- **הוראות לדיבוג**: היכן לראות את לוגי ה-`join_phone_player_audit` ולוגי ה-Edge Function.

קישור למסמך יוצב ב-`src/pages/YemotSetup.tsx` ובלוח החדש.

---

## 3. כפתור "בדיקת חיוג" (IVR Test Call)

### 3א. Edge Function חדשה: `supabase/functions/yemot-ivr-simulate/index.ts`

- מקבלת `POST` עם `{ phone: string, game_id?: string, action?: "join" | "answer", digit?: number }`.
- דורשת JWT מאומת + בודקת שהמשתמש הוא `created_by` של המשחק הפעיל (אבטחה).
- קוראת לאותה לוגיקת `decideIvrResponse` הטהורה מ-`logic.ts` עם פרמטרים מדומים, **בלי** לבצע `join_phone_player` אמיתי שמשנה DB. במקום זה:
  - אופציה א' (מומלצת): רצה במצב "dry-run" — קוראת לפונקציה הטהורה עם state נוכחי מהמשחק ו-`PhoneRow` מדומה, ומחזירה JSON עם `{decisions, ttsText, wouldJoinAsRecovery, wouldJoinAsLate}`.
  - אופציה ב': משתמשת במספר טלפון "sandbox" ייעודי (לדוגמה `0500000000`) שמסומן בקוד שלא יוצר רשומת `players` אמיתית (יש להוסיף בדיקה ב-RPC או prefix מיוחד).
- מחזירה גם את שלב ה-Recovery הצפוי וכל הודעה שהיתה מושמעת.

### 3ב. קומפוננטה חדשה: `src/components/game/IvrTestCallButton.tsx`

- כפתור "בדיקת חיוג IVR" בלוח החדש (סעיף 1) ובדף `YemotSetup`.
- בלחיצה: דיאלוג עם:
  - שדה למספר טלפון לדוגמה (ברירת מחדל: `0500000000`).
  - בחירת תרחיש: "הצטרפות" / "שליחת תשובה 1" / "שליחת תשובה 2" וכו'.
  - כפתור "הרץ בדיקה".
- מציג את התוצאה: ההודעה בעברית שהמתקשר היה שומע + מצב המתקשר הצפוי (רגיל / Recovery / Late) + הצלחה/כישלון.
- אם המשחק בלובי + הוזן מספר אמיתי, אופציה לסמן "בצע חיוג אמיתי" שמעדכנת את ה-DB ומופיעה ברשימה — לבדיקה End-to-End שה-Recovery עובד בפועל.

### 3ג. כפתור גישה ב-`GameHost.tsx`

הוספת כפתור איקון `<TestTube />` בסרגל העליון לצד `IvrSyncIndicator` שפותח את הדיאלוג.

---

## פרטים טכניים

**קבצים שייווצרו**:

- `src/components/game/HostLiveStatusPanel.tsx`
- `src/components/game/IvrTestCallButton.tsx`
- `supabase/functions/yemot-ivr-simulate/index.ts`
- `supabase/functions/yemot-ivr-simulate/index_test.ts`
- `docs/IVR_HEBREW_GUIDE.md`

**קבצים שיעודכנו**:

- `src/pages/GameHost.tsx` — שילוב `HostLiveStatusPanel` ו-`IvrTestCallButton`.
- `src/pages/YemotSetup.tsx` — קישור למסמך + שילוב `IvrTestCallButton`.
- `supabase/functions/yemot-ivr/logic.ts` — חשיפת helper `classifyJoiner(state, phoneRow, now)` שמחזיר `"normal" | "recovery" | "late"` (לשימוש משותף עם הסימולציה והפאנל).
- `supabase/functions/yemot-ivr/logic_test.ts` — בדיקות ל-`classifyJoiner`.
- `supabase/config.toml` — לא נדרש שינוי (verify_jwt ברירת מחדל לפונקציה החדשה).

**אבטחה**:

- ה-Edge Function החדשה דורשת JWT (לא `verify_jwt = false`) ובודקת בעלות על המשחק לפני שמחזירה state.
- מספר ה-sandbox `0500000000` יוגדר בקבוע בלבד בצד הלקוח, אך הסרבר תמיד מבצע בדיקת בעלות.

**אין שינויי סכמה ב-DB** — הכל מבוסס על העמודות הקיימות ב-`phone_players` ו-`games`.

**בדיקות**:

- בדיקות Deno חדשות לפונקציית הסימולציה.
- בדיקות ל-`classifyJoiner` עם תרחישי Recovery, Late ו-Normal.
- הרצת `supabase--test_edge_functions` בסוף.

---

## סדר ביצוע

1. הוספת `classifyJoiner` ל-`logic.ts` + בדיקות.
2. יצירת המסמך `docs/IVR_HEBREW_GUIDE.md`.
3. בניית `HostLiveStatusPanel` ושילוב ב-`GameHost`.
4. יצירת Edge Function `yemot-ivr-simulate` + בדיקות + Deploy.
5. בניית `IvrTestCallButton` ושילוב ב-`GameHost` וב-`YemotSetup`.
6. הרצת כל הבדיקות ווידוא שאין רגרסיה.
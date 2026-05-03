## מה ייבנה

### 1. מסד נתונים (מיגרציה)
- טבלה `phone_players`: `phone` (PK), `player_id`, `game_id`, `last_question_index`, `last_answer_at`, `created_at`
- RPC `join_phone_player(p_phone text)` — SECURITY DEFINER:
  - מוצא את המשחק היחיד שב-`status` של lobby/playing/question/results/leaderboard
  - אם המתקשר כבר רשום למשחק זה — מחזיר את השחקן הקיים
  - אחרת יוצר שחקן חדש בשם `מתקשר {4 ספרות אחרונות}` ושומר ב-`phone_players`
  - מחזיר: `player_id`, `secret_token`, `game_id`, `status`, `current_question_index`, `time_remaining`, `question_ids`
- RPC `submit_phone_answer(p_phone, p_question_index, p_answer)` — אימות שהמשחק ב-`question`, שהאינדקס תואם, וקריאה לאותה לוגיקת ניקוד כמו submit-answer

### 2. Edge Function `yemot-ivr` (verify_jwt=false)
- מאמתת `?secret=YEMOT_WEBHOOK_SECRET` בכל קריאה
- קוראת את הפרמטרים שימות שולחת: `ApiCallId`, `ApiPhone`, `ApiExtension`, `ApiYFLastInput` (הקשת המשתמש)
- מחזירה תגובה בפורמט של ימות (טקסט פשוט עם פקודות `id_list_message`, `read`, `go_to_folder` וכו')
- מצבים:
  - **ראשון**: `join_phone_player` → מקריא "הצטרפת בהצלחה כמתקשר 1234, המתן לתחילת המשחק" → לולאת polling
  - **לובי/בין שאלות**: `go_to_folder=/{ext}` כל 3 שניות עד שמתחיל question
  - **שאלה פעילה**: קורא `read` עם `tap` של ספרה אחת (1-4) ו-timeout של `time_remaining` שניות
  - **קלט**: `submit_phone_answer` → "תשובתך נקלטה" → חזרה ללולאה
  - **leaderboard/finished**: מקריא "המשחק הסתיים" → `hangup`

### 3. מסך הוראות `/yemot-setup` (חדש)
דף ייעודי בעברית, RTL, עם עיצוב הקלף הקיים. מקושר מ-Admin תחת "אינטגרציית טלפון".

תוכן מודרך צעד-צעד:
1. **דרישות מקדימות** — חשבון פעיל בימות המשיח, קו עם תפריט (שלוחה)
2. **ה-URL להדבקה** (תיבה עם כפתור העתקה):
   `https://wzmspoufqdldcuagsvir.supabase.co/functions/v1/yemot-ivr?secret=***`
   (ה-secret מוסתר; כפתור "הצג/העתק עם הסוד" שדורש שהמשתמש מחובר כבעלים)
3. **איפה להדביק** — הסבר מפורט עם צילום מסך/דיאגרמה ASCII:
   - היכנס ל-`https://www.call2all.co.il` והתחבר
   - תפריט ראשי → "ניהול מערכת"/"ימות לעורכי תוכן" → "קבצים"
   - נווט לתיקיית השלוחה הרצויה (למשל `1/` לשלוחה 1)
   - צור/ערוך קובץ `ext.ini` בתיקיית השלוחה
   - הדבק את התוכן:
     ```
     type=api_call
     api_call_url=https://wzmspoufqdldcuagsvir.supabase.co/functions/v1/yemot-ivr?secret=YOUR_SECRET
     api_call_method=GET
     ```
   - שמור
4. **חלופה דרך FTP** — פרטי שרת `ym2.call2all.co.il`, מספר מערכת+סיסמה, נתיב `/ivr2:1/ext.ini`
5. **בדיקה** — חייג למספר → השלוחה → אמור להישמע "הצטרפת בהצלחה כמתקשר ####"
6. **פתרון תקלות** — מה לעשות אם נשמע "שגיאה במערכת" (אין משחק פעיל / secret שגוי) + לינק ללוגים

### 4. סוד נדרש
`YEMOT_WEBHOOK_SECRET` — אבקש ממך אחרי המיגרציה.

## פרטים טכניים

**פרוטוקול ימות (api_call):** ימות שולחת GET עם פרמטרים בכל אינטראקציה. התשובה היא טקסט פשוט עם פקודות שמופרדות ב-`&`:
- `id_list_message=t-טקסט.` — TTS
- `read=t-נא להקיש.,answer,tap,1,no,1,4,7,no,no` — קלט DTMF
- `go_to_folder=/1` — קפיצה לשלוחה (ל-polling)
- `hangup=yes`

**זיהוי מצב לקוח:** ימות לא שומרת state — אנחנו גוזרים את המצב מ-`phone_players.last_question_index` מול `games.current_question_index`.

**מיגרציה — `phone_players`:**
- RLS: `SELECT/INSERT/UPDATE` חסומים לכולם; הגישה רק דרך RPCs SECURITY DEFINER.

**Admin:** קישור חדש "📞 הוראות התקנה לימות" שמוביל ל-`/yemot-setup`.

## קבצים שייווצרו/יערכו
- `supabase/migrations/<ts>_phone_ivr.sql` — חדש
- `supabase/functions/yemot-ivr/index.ts` — חדש
- `src/pages/YemotSetup.tsx` — חדש
- `src/App.tsx` — נתיב חדש
- `src/pages/Admin.tsx` — קישור

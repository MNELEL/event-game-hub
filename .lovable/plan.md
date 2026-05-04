
# חיבור-מחדש אוטומטי ב-IVR והודעות הכוונה

## 1. שינוי DB — `join_phone_player` (חלון חסד לשאלה ראשונה)

**מטרה:** מתקשר שמחייג אחרי שהמארח לחץ "הפעלה", כל עוד **השאלה הראשונה עדיין רצה** — נרשם כמשתתף מלא ולא כ-late joiner.

**שינויים בפונקציה:**
- מוסיפים תנאי חדש: `v_first_question_ok = (status IN ('question','playing','results','leaderboard') AND current_question_index = 0)`
- `v_in_lobby = (status='lobby' AND grace_ok) OR v_first_question_ok`
- כשמתקשר חוזר שכבר נרשם כ-late ומחייג שוב בזמן שאלה 1 → מעדכנים אותו ל-`joined_in_lobby = true` (auto-recovery)
- ה-audit log מקבל סיבה ייעודית: `"first-question grace recovery"` כדי שתראה במסך הניהול שזה קרה

## 2. עדכון `supabase/functions/yemot-ivr/logic.ts`

### א. הודעת recovery כשהוקפצנו אוטומטית מ-late ל-eligible

מוסיפים זיהוי חד-פעמי בתחילת השיחה כשהמתקשר חזר ועלה לשאלה הראשונה:
- אם `joinedInLobby=true` אבל `status='question'` ו-`current_question_index=0` והשיחה נוצרה בעשר השניות האחרונות
- משמיעים פעם אחת: *"שלום, נרשמת בשם מתקשר XXXX. המשחק כבר התחיל אבל הספקת להצטרף לשאלה הראשונה. הקשב לשאלה והקש 1 עד 4 לבחירת התשובה."*
- משתמשים ב-`valName=recovered_intro` כדי שלא יחזור על עצמו

### ב. שיפור הודעת late-joiner קיימת (שורה 156-160)

הטקסט הנוכחי לא מסביר מה לעשות. השינוי:
- במקום "תוכל לענות במשחק הבא" → מוסיפים: *"אנא הישאר על הקו עד סיום המשחק הנוכחי. ברגע שיתחיל משחק חדש, נצרף אותך אוטומטית ותשמע 'ברוכים הבאים'. אז תוכל לענות על השאלות על-ידי הקשת 1, 2, 3 או 4."*

### ג. הוראת מענה ברורה בהקראת השאלה הראשונה

בקוד הקיים שמקריא שאלה (שורה 263-265), כשזו השאלה הראשונה (`current_question_index=0`) מוסיפים פתיח קצר:
- *"זוהי השאלה הראשונה. הקשב היטב לארבע האפשרויות, ובסיום הקש את מספר התשובה הנכונה."*

## 3. עדכון Edge Function `yemot-ivr/index.ts`

אין שינוי לוגי — הוא כבר קורא ל-`join_phone_player` בכל קריאה, אז ה-recovery מהמיגרציה (סעיף 1) יזרום אוטומטית. נוסיף רק `console.log` כשהאודיט מחזיר outcome=`recovered` כדי שיהיה קל לאתר ב-logs.

## 4. עדכון בדיקות `logic_test.ts`

מוסיפים שני בדיקות:
- `"recovered intro plays once when joining during first question"`
- `"late joiner message includes 'stay on line for next game' instructions"`

## טבלת התנהגות סופית

| מצב כשהמתקשר מחייג | לפני | אחרי |
|---|---|---|
| Lobby (לפני "הפעלה") | ✅ נכנס | ✅ נכנס |
| Lobby + grace window פתוח | ✅ נכנס | ✅ נכנס |
| שאלה 1 רצה (אחרי "הפעלה") | ❌ late | ✅ **נכנס + הודעת recovery** |
| שאלה 2+ | ❌ late | ❌ late (עם הודעה משופרת) |

## קבצים שישתנו

- ✏️ `supabase/migrations/<timestamp>_first_question_grace.sql` (חדש)
- ✏️ `supabase/functions/yemot-ivr/logic.ts`
- ✏️ `supabase/functions/yemot-ivr/index.ts` (לוג בלבד)
- ✏️ `supabase/functions/yemot-ivr/logic_test.ts`

## סיכון

נמוך מאוד. החלון פתוח רק ל-`current_question_index=0`, כלומר אפשר להצטרף רק כל עוד אף אחד עוד לא ענה על השאלה השנייה. אם המשחק ממהר (15 שניות לשאלה), זה חלון של 15 שניות לכל היותר.

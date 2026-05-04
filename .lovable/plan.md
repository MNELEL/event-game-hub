## מטרה
מסך וידוא ייעודי שמסביר בדיוק איזה הרשאות צריך להפעיל בפאנל ימות המשיח כדי שה-API יוצא יעבוד מול Lovable Cloud, עם רשימת בדיקה (checklist) ופירוט השדות והדומיינים.

## מה ייבנה

### 1. קומפוננטה חדשה: `src/components/yemot/ApiPermissionsChecklist.tsx`
מסך ויזואלי בעברית עם 5 בלוקים:

**א. נתיב בפאנל ימות**
- "ניהול מערכת" → "API ניהול" → טוקן "לובאבל" → "תצוגת JSON" / "הגבלות שירותים"

**ב. מה חייב להיות מאופשר (Whitelist):**
טבלה עם שדה / ערך נדרש / הסבר:
| שדה | ערך נדרש |
|---|---|
| `default_acl_policy` | `allow` |
| `ws_whitelist` חייב לכלול | `ivr2_api` |
| `ws_whitelist` חייב לכלול | `/api/UpdateExtension` |
| `ws_whitelist` חייב לכלול | `/api/GetIVR2Dir` |
| `ws_whitelist` חייב לכלול | `/api/FileAction` |

**ג. דומיין יעד שצריך להתיר (API יוצא):**
- `wzmspoufqdldcuagsvir.supabase.co`
- נתיב מלא: `https://wzmspoufqdldcuagsvir.supabase.co/functions/v1/yemot-ivr`
- כפתור CopyBox לכל ערך

**ד. הגדרות שלוחה (ext.ini) שחייבות להיות:**
- `type=api`
- `api_link=` (הקישור המלא עם הסיקרט)
- `api_extension_send=yes`
- `api_call_id_send=yes`
- `hangup_insert_file=no`

**ה. בדיקת חיבור חיה:**
- כפתור "בדוק שטוקן ה-API שלי תקין" שקורא ל-edge function חדש `verify-yemot-token` שמבצע GET ל-`https://www.call2all.co.il/ws/{token}/GetSession` ומחזיר ok/fail עם הסבר.
- הצגת התוצאה כ-checklist ירוק/אדום עם הודעת תיקון מפורטת.

### 2. Edge Function חדש: `supabase/functions/verify-yemot-token/index.ts`
- מקבל `{ token }` (או קורא מ-secret `YEMOT_API_TOKEN`).
- מבצע קריאה ל-Yemot API לבדוק:
  1. שהטוקן בכלל תקף (GetSession).
  2. שיש הרשאת `GetIVR2Dir` (ניסיון קריאת ספריה).
  3. שיש הרשאת `UpdateExtension` (ניסיון dry של עדכון על שלוחה לא קיימת — מצפה ל-error ספציפי, לא חסימה).
- מחזיר מערך checks דומה ל-`check-yemot-extension`.
- `verify_jwt = false` ב-config.toml.

### 3. אינטגרציה ב-`src/pages/YemotSetup.tsx`
- הוספת טאב/כרטיס חדש למעלה: "וידוא הרשאות API" עם הקומפוננטה.
- כשהמשתמש נתקל ב"שגיאת אבטחה" — קישור ישיר אליו מהקארד הקיים של troubleshooting.

### 4. תוכן עזרה
טקסט מוכן (CopyBox) לפנייה לתמיכת ימות במקרה שההרשאות חסרות, עם פירוט מדויק של השדות שצריך לפתוח.

## פרטים טכניים
- כל הקריאות מהקליינט עוברות דרך edge function (לא חושפים את ה-YEMOT_API_TOKEN).
- אם `YEMOT_API_TOKEN` לא מוגדר כסיקרט — תוצג הודעה ברורה עם כפתור הוספה.
- שימוש ב-`CopyBox` הקיים, ב-`Card` ובאייקונים `CheckCircle2`/`XCircle` לעקביות ויזואלית.

## קבצים שייווצרו/יעודכנו
- חדש: `src/components/yemot/ApiPermissionsChecklist.tsx`
- חדש: `supabase/functions/verify-yemot-token/index.ts`
- עדכון: `supabase/config.toml` (רישום הפונקציה)
- עדכון: `src/pages/YemotSetup.tsx` (שילוב הקומפוננטה)

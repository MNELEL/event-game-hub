
## מטרה
סעיף 5 ("בדיקה חיה של ההרשאות") מחזיר 404/HTML מ־nginx כי `verify-yemot-token` קורא ל־`https://www.call2all.co.il/ws/{token}/...` שלא קיים. בנוסף הוא משתמש ב־`YEMOT_API_TOKEN` הגלובלי במקום בטוקן של המשתמש.

## שינויים

### `supabase/functions/verify-yemot-token/index.ts` — שכתוב

1. **מקור הטוקן:** קודם לטעון מ־`yemot_credentials` לפי `owner_id = auth.uid()`, ורק כ־fallback להשתמש ב־`YEMOT_API_TOKEN` מה־env.
2. **שיטת קריאה:** להחליף את `call()` ל־POST על `https://www.call2all.co.il/ym/api/{action}` עם `FormData` שכולל `token` (זהה ל־`setup-yemot-extension`).
3. **ארבע בדיקות:**
   - `GetSession` — תקפות הטוקן. אם נכשל, להפסיק כאן ולהחזיר הודעה ברורה ("האסימון לא תקף").
   - `GetIVR2Dir` עם `path: "ivr2:/"` — הרשאת קריאה.
   - `UpdateExtension` עם `path: "ivr2:/9999"` ו־`whatToDo: "GetSettings"` — non-destructive; "שלוחה לא קיימת" עדיין מוכיח שההרשאה עובדת.
   - `UploadTextFile` על קובץ probe זמני (`ivr2:/_lovable_probe_{ts}.txt`) — בדיוק ה־endpoint שבו משתמשים בפועל לכתיבת `ext.ini`. ניקוי best-effort דרך `FileAction whatToDo=delete`.
4. **זיהוי שגיאות הרשאה:** פונקציית עזר `isPermissionError()` שמחפשת `not allowed | forbidden | אבטח | הרשא | whitelist` ב־`json.message` או בטקסט. הודעות שגיאה ידידותיות (חיתוך HTML, חיתוך ל־200 תווים).

### בלי שינויים ב־DB, ב־frontend או בקבצים אחרים.

## טכני קצר
- `supabase/functions/verify-yemot-token/index.ts` — מוחלף במלואו (~150 שורות).
- redeploy אוטומטי של `verify-yemot-token`.

## תוצאה צפויה
סעיף 5 בעמוד `YemotSetup` יציג ✓ ירוק לכל ארבעת השלבים (כפי שכבר קורה בסעיף E2E). אם הטוקן לא תקף או שחסרה הרשאה ספציפית — תוצג הודעה מדויקת עם הפעולה המתקנת.

## כפתור "סובב Secret והטמע אוטומטית"

### המטרה
לחיצה אחת שתבצע את כל התהליך: יצירת `webhook_secret` חדש → שמירה ב-DB → קריאה אוטומטית ל-`setup-yemot-extension` שתעדכן את `ext.ini` בימות עם ה-secret החדש. ללא צורך בגישה ידנית ל-Supabase או לפאנל ימות.

### שינויים

**1. `src/components/yemot/YemotCredentialsCard.tsx`**
- הוספת prop אופציונלי `extension?: string` (ברירת מחדל: `localStorage.getItem("yemot_extension") || "1"`).
- הוספת מצב חדש `"rotate_apply"` ל-`busy`.
- הוספת פונקציה `rotateAndApply()` שמבצעת ברצף:
  1. `supabase.functions.invoke("yemot-credentials", { body: { action: "rotate_secret" } })`
  2. אם הצליח — `supabase.functions.invoke("setup-yemot-extension", { body: { extension } })`
  3. toast הצלחה אחד מאוחד: "Secret חדש נוצר והשלוחה X עודכנה בימות".
  4. שגיאה בכל שלב — toast מפורט עם המקור (rotate / setup).
- הוספת כפתור ראשי חדש (variant `default`) ליד הכפתורים הקיימים: **"סובב Secret והטמע אוטומטית"** עם אייקון `Wand2` (או `Zap`).
- הכפתור הקיים "צור webhook secret חדש" נשאר כאופציה מתקדמת (ללא הטמעה).

**2. `src/pages/YemotSetup.tsx`**
- העברת `extension` הקיים כ-prop ל-`<YemotCredentialsCard extension={extension} />` כדי שהפעולה האוטומטית תשתמש באותה שלוחה שהמשתמש בחר בעמוד.

### בלי שינויים
- אין מיגרציות DB.
- אין שינוי ב-edge functions (שתי הפעולות הנדרשות כבר קיימות: `yemot-credentials/rotate_secret` ו-`setup-yemot-extension`).
- אין שינוי ב-RLS / secrets.

### תוצאה
המשתמש לוחץ כפתור אחד בכרטיס "חיבור לחשבון ימות שלי" — והמערכת מסובבת את ה-secret ומעדכנת את ext.ini בימות אוטומטית. אם השלוחה לא הוגדרה עדיין, התהליך מטמיע אותה מאפס באותה לחיצה.
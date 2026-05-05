# הצגת כתובת ה-Webhook + עדכון אוטומטי של api_link

## מטרה
להציג למשתמש את ה-URL המלא של `yemot-ivr` בעמוד `/yemot-setup`, עם:
1. כפתור העתקה ללוח בלחיצה אחת.
2. כפתור "עדכן api_link בימות אוטומטית" שמטמיע את ה-URL כ-`ext.ini` בשלוחה — בלי לסובב את ה-secret הקיים.

## שינוי יחיד: `src/components/yemot/YemotCredentialsCard.tsx`

### ייבואים
להוסיף `Copy`, `Link as LinkIcon`, `Upload` ל-imports מ-`lucide-react`.

### state חדש
```ts
const [copied, setCopied] = useState(false);
const [showUrlSecret, setShowUrlSecret] = useState(false);
```
ולהרחיב את `busy` כך שיכלול גם `"apply_only"`.

### חישוב ה-URL
```ts
const ivrUrl = state?.webhook_secret
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/yemot-ivr?secret=${encodeURIComponent(state.webhook_secret)}`
  : null;
const ivrUrlMasked = state?.webhook_secret
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/yemot-ivr?secret=••••${state.webhook_secret.slice(-4)}`
  : null;
```

### פונקציות חדשות
```ts
const copyUrl = async () => {
  if (!ivrUrl) return;
  try {
    await navigator.clipboard.writeText(ivrUrl);
  } catch {
    // fallback ל-iframes/preview ללא clipboard API
    const ta = document.createElement("textarea");
    ta.value = ivrUrl; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
  }
  setCopied(true);
  setOk("ה-URL הועתק. הדבק אותו ב-api_link בפאנל ימות, או לחץ 'עדכן בימות אוטומטית'.");
  toast.success("ה-URL הועתק ללוח");
  setTimeout(() => setCopied(false), 2000);
};

const applyOnly = async () => {
  const ext = ((extension ?? localStorage.getItem("yemot_extension") ?? "1") || "1")
    .replace(/[^0-9]/g, "") || "1";
  setBusy("apply_only"); clearInline();
  try {
    const r = await supabase.functions.invoke("setup-yemot-extension", { body: { extension: ext } });
    if (r.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: r.error.message };
    const d = r.data as any;
    if (d?.error) throw { source: `עדכון ext.ini בשלוחה ${ext}`, message: d.error, details: d.details, raw: d.raw };
    setOk(`api_link עודכן אוטומטית בשלוחה ${ext} בימות`);
    toast.success(`שלוחה ${ext} עודכנה בימות`);
    onChanged?.();
  } catch (e: any) {
    setErr(e?.source || "עדכון ext.ini", e, "עדכון השלוחה נכשל. ייתכן שלאסימון אין הרשאת UploadTextFile.");
    toast.error(e?.message || "עדכון השלוחה נכשל");
  } finally {
    setBusy(null);
  }
};
```

### UI חדש (להוסיף אחרי קופסת הסטטוס "מוגדר/לא מוגדר", לפני באנרי inlineSuccess/Error)
קופסה בסגנון פרגמנט (border-2 + bg רך) עם:
- כותרת + אייקון `LinkIcon`: "כתובת Webhook עבור api_link בימות"
- אם `!ivrUrl`: הודעה "צור secret כדי לקבל את ה-URL".
- אם `ivrUrl`:
  - `<input readOnly dir="ltr" value={showUrlSecret ? ivrUrl : ivrUrlMasked} />` תופס את כל הרוחב, font-mono, רקע background, גבול border.
  - שורה תחתית עם:
    - כפתור טקסט קטן עם `Eye/EyeOff` להחלפת `showUrlSecret`.
    - כפתור `Copy` ראשי: `{copied ? <CheckCircle2 /> "הועתק!" : <Copy /> "העתק URL"}`
    - כפתור `Upload`/`Wand2` משני: "עדכן api_link בימות אוטומטית" → קורא ל-`applyOnly`. disabled כש-`!state.configured || !state.last_verified_at || busy === "apply_only"`. tooltip: "שמור ואמת אסימון API קודם" כשלא מאומת.
  - הערת עזרה: "השתמש בכפתור האוטומטי אם הזנת אסימון API עם הרשאת כתיבה (UploadTextFile)."

### לא משנים
- אין שינויים ב-edge functions (`setup-yemot-extension`, `yemot-credentials`).
- אין שינויי DB.
- כפתורי "סובב Secret והטמע אוטומטית" / "שמור ואמת" / "בדוק חיבור" / "צור secret בלבד" נשארים כמו שהם.

## אישור
לאחר אישור — מעבר למצב build וביצוע השינוי בקובץ אחד.
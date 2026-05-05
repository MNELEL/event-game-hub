# בדיקת הרשאת UploadTextFile

## שינוי 1: `supabase/functions/yemot-credentials/index.ts`
פעולה חדשה `check_upload_permission` — מעלה קובץ probe קטן לשלוחה ומוחק אותו, ומחזירה אבחנה מפורטת.

```ts
if (action === "check_upload_permission") {
  if (!existing?.yemot_api_token) return json({ error: "אין אסימון שמור" }, 400);
  const ext = ((body as any).extension || "1").toString().replace(/[^0-9]/g, "") || "1";
  const probePath = `ivr2:/${ext}/_lovable_probe_${Date.now()}.txt`;
  const token = existing.yemot_api_token;

  const upForm = new FormData();
  upForm.append("token", token);
  upForm.append("what", probePath);
  upForm.append("contents", "lovable-permission-probe");
  const upRes = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", { method: "POST", body: upForm });
  const upText = await upRes.text();
  let upJson: any = null; try { upJson = JSON.parse(upText); } catch {}

  const upOk = upRes.ok && (!upJson || upJson.responseStatus === "OK");
  if (!upOk) {
    const m = ((upJson?.message || "") + " " + upText).toLowerCase();
    let code = "PERMISSION_DENIED";
    let friendly = "אין הרשאת UploadTextFile לאסימון";
    let next_step = "בפאנל ימות → ניהול מערכת → API: סמן הרשאות UploadTextFile + FileAction + DownloadFile, צור אסימון חדש ושמור אותו כאן.";
    if (m.includes("not_login") || m.includes("invalid_token") || m.includes("token")) {
      code = "INVALID_TOKEN"; friendly = "האסימון אינו תקף או שפג תוקפו";
      next_step = "צור אסימון חדש בפאנל ימות ושמור אותו כאן.";
    } else if (m.includes("not_exists") || m.includes("path") || m.includes("dir")) {
      code = "EXTENSION_NOT_EXISTS"; friendly = `שלוחה ${ext} לא קיימת בפאנל ימות`;
      next_step = `צור שלוחה ${ext} בפאנל ימות (סוג: API) ונסה שוב.`;
    } else if (m.includes("quota") || m.includes("storage")) {
      code = "QUOTA_EXCEEDED"; friendly = "חרגת ממכסת האחסון בימות";
      next_step = "פנה אחסון בפאנל ימות.";
    }
    return json({ ok: false, can_upload: false, code, message: friendly, next_step, extension: ext, details: upJson || upText });
  }

  // Cleanup probe (best effort)
  let cleanup_ok = false;
  try {
    const delForm = new FormData();
    delForm.append("token", token); delForm.append("whatToDo", "DeleteFile"); delForm.append("path", probePath);
    const delRes = await fetch("https://www.call2all.co.il/ym/api/FileAction", { method: "POST", body: delForm });
    const delText = await delRes.text();
    let delJson: any = null; try { delJson = JSON.parse(delText); } catch {}
    cleanup_ok = delRes.ok && (!delJson || delJson.responseStatus === "OK");
  } catch {}

  return json({
    ok: true, can_upload: true, cleanup_ok, extension: ext, probe_path: probePath,
    message: cleanup_ok
      ? "הרשאת UploadTextFile תקינה — ניתן להטמיע api_link אוטומטית"
      : `העלאת קובץ הצליחה אך מחיקת קובץ הבדיקה נכשלה (חסרה הרשאת FileAction). אפשר למחוק ידנית את ${probePath}.`,
  });
}
```

## שינוי 2: `src/components/yemot/YemotCredentialsCard.tsx`

### State
- להרחיב `busy` עם `"check_perm"`.
- להוסיף: `const [permStatus, setPermStatus] = useState<{ ok: boolean; message: string } | null>(null);`

### פונקציה
```ts
const checkUploadPermission = async () => {
  const v = validateExtension(getExtensionRaw());
  if (!v.ok) {
    setInlineError({ source: "אימות מספר שלוחה", message: v.reason, nextStep: v.nextStep });
    setInlineSuccess(null); toast.error(v.reason); return;
  }
  setBusy("check_perm"); clearInline();
  try {
    const r = await supabase.functions.invoke("yemot-credentials", {
      body: { action: "check_upload_permission", extension: v.ext },
    });
    if (r.error) throw { source: "בדיקת הרשאת UploadTextFile", message: r.error.message };
    const d = r.data as any;
    if (d?.ok) {
      setPermStatus({ ok: true, message: d.message });
      setOk(d.message); toast.success("הרשאת כתיבה תקינה");
    } else {
      setPermStatus({ ok: false, message: d?.message || "אין הרשאה" });
      setErr("בדיקת הרשאת UploadTextFile",
        { message: d?.message, next_step: d?.next_step, details: d?.details, code: d?.code },
        "אין הרשאת UploadTextFile");
    }
  } catch (e: any) {
    setPermStatus({ ok: false, message: e?.message || "בדיקת ההרשאה נכשלה" });
    setErr("בדיקת הרשאת UploadTextFile", e, "בדיקת ההרשאה נכשלה");
    toast.error(e?.message || "בדיקת ההרשאה נכשלה");
  } finally { setBusy(null); }
};
```

### UI — בקופסת ה-URL, ליד "העתק" ו"עדכן api_link":
```tsx
<Button
  size="sm" variant="outline" onClick={checkUploadPermission}
  disabled={!state?.configured || !state?.last_verified_at || busy === "check_perm"}
  title="מעלה ומוחק קובץ זמני בשלוחה כדי לוודא הרשאת כתיבה"
  className="gap-2"
>
  {busy === "check_perm" ? <Loader2 className="w-4 h-4 animate-spin" />
   : permStatus?.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
   : permStatus && !permStatus.ok ? <XCircle className="w-4 h-4 text-destructive" />
   : <ShieldCheck className="w-4 h-4" />}
  בדוק הרשאת UploadTextFile
</Button>
```

ושורת תג מתחת אם `permStatus` קיים:
```tsx
{permStatus && (
  <p className={`text-xs ${permStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
    {permStatus.ok ? "✓ " : "✗ "}{permStatus.message}
  </p>
)}
```

## הערות
- הטוקן לא נחשף ל-client; ה-probe רץ בצד השרת בלבד.
- ה-probe יוצר קובץ בנתיב ייחודי עם timestamp — בטוח לריצות חוזרות.
- אם המחיקה נכשלת — מציגים למשתמש את הנתיב המדויק למחיקה ידנית.
- אין שינויי DB / RLS / secrets.

מאשר?
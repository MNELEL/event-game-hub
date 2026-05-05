// Verify Yemot API token permissions using the same /ym/api endpoint that
// actually works (the /ws/{token}/... path returns 404 from nginx).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Check = { key: string; ok: boolean; detail: string };

async function call(token: string, action: string, params: Record<string, string> = {}) {
  const form = new FormData();
  form.append("token", token);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  try {
    const res = await fetch(`https://www.call2all.co.il/ym/api/${action}`, {
      method: "POST",
      body: form,
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, text, json };
  } catch (e: any) {
    return { status: 0, text: String(e?.message || e), json: null };
  }
}

function isPermissionError(text: string, json: any): boolean {
  const msg = (json?.message || text || "").toString();
  return /not.?allowed|forbidden|denied|אבטח|הרשא|permission|whitelist/i.test(msg);
}

function shortErr(text: string, json: any): string {
  if (json?.message) return String(json.message).slice(0, 200);
  const stripped = (text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return stripped.slice(0, 200) || "ללא פרטים";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return reply({ ok: false, error: "Unauthorized" }, 401);

    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await supa.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !userData?.user) return reply({ ok: false, error: "Unauthorized" }, 401);

    // Prefer the user's own token from yemot_credentials, fallback to env
    const { data: cred } = await supa
      .from("yemot_credentials")
      .select("yemot_api_token")
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    const token = cred?.yemot_api_token || Deno.env.get("YEMOT_API_TOKEN");

    if (!token) {
      return reply({
        ok: false,
        configured: false,
        message: "לא הוזן אסימון ימות. הזן אותו בכרטיס 'הגדרות ימות' למעלה.",
        checks: [],
      });
    }

    const checks: Check[] = [];

    // 1) GetSession — token validity
    const session = await call(token, "GetSession");
    const sessionOk = session.status === 200 && session.json?.responseStatus === "OK";
    checks.push({
      key: "תקפות הטוקן (GetSession)",
      ok: sessionOk,
      detail: sessionOk
        ? `מחובר. חשבון: ${session.json?.username || session.json?.tokenName || "(ללא שם)"}`
        : `שגיאה: ${shortErr(session.text, session.json)}`,
    });

    if (!sessionOk) {
      return reply({
        ok: false,
        configured: true,
        checks,
        message: "האסימון לא תקף — בדוק שהעתקת אותו במלואו והוא לא פג תוקף.",
      });
    }

    // 2) GetIVR2Dir — read extensions tree
    const dir = await call(token, "GetIVR2Dir", { path: "ivr2:/" });
    const dirOk = dir.status === 200 &&
      (dir.json?.responseStatus === "OK" || Array.isArray(dir.json?.dirs) || Array.isArray(dir.json?.files));
    checks.push({
      key: "הרשאת קריאה (GetIVR2Dir)",
      ok: dirOk,
      detail: dirOk
        ? "הקריאה התקבלה — אפשר לקרוא את עץ השלוחות"
        : isPermissionError(dir.text, dir.json)
        ? "ההרשאה חסומה ב-whitelist. הוסף /api/GetIVR2Dir לרשימת ws_whitelist"
        : `שגיאה: ${shortErr(dir.text, dir.json)}`,
    });

    // 3) UpdateExtension — non-destructive GetSettings on (likely) non-existent ext
    const upd = await call(token, "UpdateExtension", {
      path: "ivr2:/9999",
      whatToDo: "GetSettings",
    });
    const updPerm = isPermissionError(upd.text, upd.json);
    const updOk = upd.status === 200 && !updPerm;
    checks.push({
      key: "הרשאת כתיבה (UpdateExtension)",
      ok: updOk,
      detail: updOk
        ? "הקריאה התקבלה — אפשר לעדכן שלוחות"
        : updPerm
        ? "ההרשאה חסומה ב-whitelist. הוסף /api/UpdateExtension לרשימת ws_whitelist"
        : `שגיאה: ${shortErr(upd.text, upd.json)}`,
    });

    // 4) UploadTextFile — exact endpoint we use to write ext.ini
    const probePath = `ivr2:/_lovable_probe_${Date.now()}.txt`;
    const up = await call(token, "UploadTextFile", {
      what: probePath,
      contents: "lovable-permission-probe",
    });
    const upPerm = isPermissionError(up.text, up.json);
    const upOk = up.status === 200 && (!up.json || up.json.responseStatus === "OK") && !upPerm;
    checks.push({
      key: "הרשאת העלאת קבצים (UploadTextFile)",
      ok: upOk,
      detail: upOk
        ? "הקובץ הועלה בהצלחה — ext.ini יוכל להיכתב"
        : upPerm
        ? "ההרשאה חסומה. הוסף /api/UploadTextFile לרשימת ws_whitelist"
        : `שגיאה: ${shortErr(up.text, up.json)}`,
    });

    // Best-effort cleanup
    if (upOk) {
      try {
        await call(token, "FileAction", { what: probePath, whatToDo: "delete" });
      } catch { /* ignore */ }
    }

    const allOk = checks.every((c) => c.ok);
    return reply({
      ok: allOk,
      configured: true,
      checks,
      message: allOk
        ? "כל ההרשאות תקינות — ימות יכולה לדבר עם Lovable Cloud"
        : "יש הרשאות חסרות — ראה פירוט בכל סעיף",
    });
  } catch (e: any) {
    return reply({ ok: false, error: String(e?.message || e), checks: [] }, 500);
  }
});

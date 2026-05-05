// Verify Yemot API token permissions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Check = { key: string; ok: boolean; detail: string };

async function call(token: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://www.call2all.co.il/ws/${encodeURIComponent(token)}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }
    return { status: res.status, text, json };
  } catch (e: any) {
    return { status: 0, text: String(e?.message || e), json: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = Deno.env.get("YEMOT_API_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({
          ok: false,
          configured: false,
          message: "YEMOT_API_TOKEN לא מוגדר ב-Lovable Cloud",
          checks: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const checks: Check[] = [];

    // 1. GetSession - validates the token works at all
    const session = await call(token, "GetSession");
    const sessionOk = session.status === 200 && session.json?.responseStatus === "OK";
    checks.push({
      key: "תקפות הטוקן (GetSession)",
      ok: sessionOk,
      detail: sessionOk
        ? `מחובר. שם הטוקן: ${session.json?.tokenNike || "(ללא שם)"}`
        : `שגיאה: ${session.text?.slice(0, 200) || `סטטוס ${session.status}`}`,
    });

    // 2. GetIVR2Dir - read extensions tree
    const dir = await call(token, "GetIVR2Dir", { path: "ivr2:" });
    const dirOk = dir.status === 200 && (dir.json?.responseStatus === "OK" || Array.isArray(dir.json?.dirs));
    const dirBlocked = /not.?allowed|forbidden|denied|הרשא/i.test(dir.text || "");
    checks.push({
      key: "הרשאת קריאה (GetIVR2Dir)",
      ok: dirOk,
      detail: dirOk
        ? "הקריאה התקבלה — אפשר לקרוא את עץ השלוחות"
        : dirBlocked
        ? "ההרשאה חסומה ב-whitelist. הוסף /api/GetIVR2Dir לרשימת ws_whitelist"
        : `שגיאה: ${dir.text?.slice(0, 200) || `סטטוס ${dir.status}`}`,
    });

    // 3. UpdateExtension on a non-existent path - we expect a logical error, NOT a permission block
    const upd = await call(token, "UpdateExtension", {
      path: "ivr2:9999",
      type: "menu",
      whatToDo: "check",
    });
    const updBlocked = /not.?allowed|forbidden|denied|אבטח|הרשא/i.test(upd.text || "");
    const updOk = upd.status === 200 && !updBlocked;
    checks.push({
      key: "הרשאת כתיבה (UpdateExtension)",
      ok: updOk,
      detail: updOk
        ? "הקריאה התקבלה — אפשר לעדכן שלוחות"
        : updBlocked
        ? "ההרשאה חסומה ב-whitelist. הוסף /api/UpdateExtension לרשימת ws_whitelist"
        : `שגיאה: ${upd.text?.slice(0, 200) || `סטטוס ${upd.status}`}`,
    });

    // 4. FileAction (ListFiles on root) - storage permission for music/audio
    const fa = await call(token, "FileAction", { whatToDo: "ListFiles", path: "ivr2:" });
    const faBlocked = /not.?allowed|forbidden|denied|הרשא/i.test(fa.text || "");
    const faOk = fa.status === 200 && !faBlocked;
    checks.push({
      key: "הרשאת קבצים (FileAction)",
      ok: faOk,
      detail: faOk
        ? "אפשר לנהל קבצי שמע"
        : faBlocked
        ? "הוסף /api/FileAction לרשימת ws_whitelist"
        : `שגיאה: ${fa.text?.slice(0, 200) || `סטטוס ${fa.status}`}`,
    });

    const allOk = checks.every((c) => c.ok);

    return new Response(
      JSON.stringify({
        ok: allOk,
        configured: true,
        checks,
        message: allOk
          ? "כל ההרשאות תקינות — ימות יכולה לדבר עם Lovable Cloud"
          : "יש הרשאות חסרות — ראה פירוט בכל סעיף",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e), checks: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Auto-configure Yemot extension by uploading ext.ini via Yemot API
// Now with verification (read-back) and dual-write (target ext + root) so
// the IVR works regardless of where the call enters.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YEMOT_API_TOKEN = Deno.env.get("YEMOT_API_TOKEN") || "";
const YEMOT_WEBHOOK_SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function uploadIni(apiToken: string, path: string, contents: string) {
  const form = new FormData();
  form.append("token", apiToken);
  form.append("what", path);
  form.append("contents", contents);
  const res = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch {}
  const ok = res.ok && (!parsed || parsed.responseStatus === "OK");
  return { ok, parsed, text, path };
}

async function verifyIni(apiToken: string, path: string, expectedApiLink: string) {
  const form = new FormData();
  form.append("token", apiToken);
  form.append("path", path);
  const res = await fetch("https://www.call2all.co.il/ym/api/DownloadFile", {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch {}
  if (parsed && parsed.responseStatus && parsed.responseStatus !== "OK") {
    return { ok: false, exists: false, message: parsed.message || "הקובץ לא נמצא לאחר ההעלאה", raw: parsed };
  }
  const containsLink = text.includes(`api_link=${expectedApiLink}`);
  const containsType = /(^|\n)\s*type\s*=\s*api(\s|$)/i.test(text);
  return {
    ok: containsLink && containsType,
    exists: true,
    containsLink,
    containsType,
    raw: text,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: credRow } = await supa
      .from("yemot_credentials")
      .select("yemot_api_token, webhook_secret")
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    const apiToken = credRow?.yemot_api_token || YEMOT_API_TOKEN;
    const webhookSecret = credRow?.webhook_secret || YEMOT_WEBHOOK_SECRET;

    if (!apiToken) return json({ error: "חסר אסימון ימות. הזן אותו בעמוד הגדרות ימות." }, 400);
    if (!webhookSecret) return json({ error: "חסר webhook secret. צור אותו בעמוד הגדרות ימות." }, 400);

    let body: { extension?: string; skip_root?: boolean } = {};
    try { body = await req.json(); } catch {}
    const ext = (body.extension || "1").toString().replace(/[^0-9]/g, "");
    if (!ext) return json({ error: "מספר שלוחה לא תקין" }, 400);

    const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
    const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/yemot-ivr?secret=${encodeURIComponent(webhookSecret)}`;
    const iniContent = [
      "type=api",
      `api_link=${webhookUrl}`,
      "api_add_0=ApiPhone",
      "api_add_1=ApiDID",
      "api_add_2=ApiExtension",
      "api_000=none",
      "api_extension_send=yes",
      "api_call_id_send=yes",
      "hangup_insert_file=no",
      "say_error_message=no",
      "",
    ].join("\n");

    // 1) Upload to the target extension
    const targetPath = `ivr2:/${ext}/ext.ini`;
    const upMain = await uploadIni(apiToken, targetPath, iniContent);
    if (!upMain.ok) {
      return json({
        error: "ימות החזירו שגיאה בהעלאת ext.ini לשלוחה",
        details: upMain.parsed || upMain.text,
        path: targetPath,
      }, 502);
    }

    // 2) Verify by reading it back
    const verifyMain = await verifyIni(apiToken, targetPath, webhookUrl);
    if (!verifyMain.ok) {
      return json({
        error: verifyMain.exists
          ? "הקובץ הועלה אבל ה־api_link לא נמצא בו (כנראה תקלת encoding או חסימה צד־ימות)"
          : "הקובץ לא נמצא בימות לאחר ההעלאה",
        verify: verifyMain,
        path: targetPath,
      }, 502);
    }

    // 3) Best-effort: also write to root (`ivr2:/ext.ini`) — handles the case
    //    where the call enters the system at the root level instead of the
    //    target extension. Failure here is non-fatal.
    let rootResult: any = null;
    if (!body.skip_root) {
      const upRoot = await uploadIni(apiToken, "ivr2:/ext.ini", iniContent);
      rootResult = { ok: upRoot.ok, response: upRoot.parsed || upRoot.text };
    }

    // 4) Save tracking info to DB (admin client to bypass RLS edge cases)
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
        auth: { persistSession: false },
      });
      await admin
        .from("yemot_credentials")
        .update({
          extension: ext,
          last_setup_at: new Date().toISOString(),
          last_setup_path: targetPath,
        })
        .eq("owner_id", userData.user.id);
    } catch (e) {
      console.error("setup-yemot-extension: failed to update tracking", e);
    }

    return json({
      success: true,
      extension: ext,
      path: targetPath,
      verified: true,
      yemot: upMain.parsed || upMain.text,
      root: rootResult,
    });
  } catch (e) {
    console.error("setup-yemot-extension error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה" }, 500);
  }
});

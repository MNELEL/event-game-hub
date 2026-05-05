// Auto-configure Yemot extension by uploading ext.ini via Yemot API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YEMOT_API_TOKEN = Deno.env.get("YEMOT_API_TOKEN") || "";
const YEMOT_WEBHOOK_SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth - admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    // Prefer per-user credentials from DB; fall back to env for back-compat.
    const { data: credRow } = await supa
      .from("yemot_credentials")
      .select("yemot_api_token, webhook_secret")
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    const apiToken = credRow?.yemot_api_token || YEMOT_API_TOKEN;
    const webhookSecret = credRow?.webhook_secret || YEMOT_WEBHOOK_SECRET;

    if (!apiToken) return json({ error: "חסר אסימון ימות. הזן אותו בעמוד הגדרות ימות." }, 400);
    if (!webhookSecret) return json({ error: "חסר webhook secret. צור אותו בעמוד הגדרות ימות." }, 400);

    let body: { extension?: string } = {};
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

    const path = `ivr2:/${ext}/ext.ini`;

    // Yemot API: UploadTextFile expects multipart/form-data with token, what, contents
    const form = new FormData();
    form.append("token", apiToken);
    form.append("what", path);
    form.append("contents", iniContent);

    const ymRes = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", {
      method: "POST",
      body: form,
    });
    const ymText = await ymRes.text();
    let ymJson: any = null;
    try { ymJson = JSON.parse(ymText); } catch {}

    if (!ymRes.ok || (ymJson && ymJson.responseStatus && ymJson.responseStatus !== "OK")) {
      return json({
        error: "ימות החזירו שגיאה",
        details: ymJson || ymText,
      }, 502);
    }

    return json({
      success: true,
      extension: ext,
      path,
      yemot: ymJson || ymText,
    });
  } catch (e) {
    console.error("setup-yemot-extension error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה" }, 500);
  }
});

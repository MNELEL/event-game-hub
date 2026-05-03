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

    if (!YEMOT_API_TOKEN) return json({ error: "חסר YEMOT_API_TOKEN בהגדרות" }, 400);
    if (!YEMOT_WEBHOOK_SECRET) return json({ error: "חסר YEMOT_WEBHOOK_SECRET בהגדרות" }, 400);

    let body: { extension?: string } = {};
    try { body = await req.json(); } catch {}
    const ext = (body.extension || "1").toString().replace(/[^0-9]/g, "");
    if (!ext) return json({ error: "מספר שלוחה לא תקין" }, 400);

    const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
    const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/yemot-ivr?secret=${encodeURIComponent(YEMOT_WEBHOOK_SECRET)}`;
    const iniContent = `type=api_call\napi_call_url=${webhookUrl}\napi_call_method=GET\n`;

    const path = `ivr2:/${ext}/ext.ini`;

    // Yemot API: UploadTextFile expects multipart/form-data with token, what, contents
    const form = new FormData();
    form.append("token", YEMOT_API_TOKEN);
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

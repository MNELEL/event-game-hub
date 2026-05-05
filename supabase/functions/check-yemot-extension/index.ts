// Read back ext.ini from Yemot to verify the extension is wired correctly.
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await supa.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: credRow } = await supa
      .from("yemot_credentials")
      .select("yemot_api_token, webhook_secret")
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    const apiToken = credRow?.yemot_api_token || YEMOT_API_TOKEN;
    const webhookSecret = credRow?.webhook_secret || YEMOT_WEBHOOK_SECRET;

    if (!apiToken) return json({ error: "חסר אסימון ימות. הזן אותו בעמוד הגדרות ימות." }, 400);

    let body: { extension?: string } = {};
    try { body = await req.json(); } catch {}
    const ext = (body.extension || "1").toString().replace(/[^0-9]/g, "");
    if (!ext) return json({ error: "מספר שלוחה לא תקין" }, 400);

    const path = `ivr2:/${ext}/ext.ini`;
    const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
    const expectedHost = `${projectRef}.supabase.co`;
    const expectedPath = `/functions/v1/yemot-ivr`;

    const form = new FormData();
    form.append("token", apiToken);
    form.append("path", path);

    const ymRes = await fetch("https://www.call2all.co.il/ym/api/DownloadFile", {
      method: "POST",
      body: form,
    });
    const contentType = ymRes.headers.get("content-type") || "";
    let raw: string;
    let parsed: any = null;
    if (contentType.includes("application/json")) {
      raw = await ymRes.text();
      try { parsed = JSON.parse(raw); } catch {}
    } else {
      raw = await ymRes.text();
    }

    // If Yemot returned an error JSON (file not found etc.)
    if (parsed && parsed.responseStatus && parsed.responseStatus !== "OK") {
      return json({
        ok: false,
        exists: false,
        path,
        message: parsed.message || "הקובץ לא נמצא בימות",
        yemot: parsed,
      });
    }

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const kv: Record<string, string> = {};
    for (const line of lines) {
      const i = line.indexOf("=");
      if (i > 0) kv[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }

    const checks: Array<{ key: string; ok: boolean; detail: string }> = [];
    checks.push({
      key: "type=api",
      ok: kv["type"] === "api",
      detail: kv["type"] ? `type=${kv["type"]}` : "חסר",
    });

    let apiUrl: URL | null = null;
    try { apiUrl = kv["api_link"] ? new URL(kv["api_link"]) : null; } catch {}
    checks.push({
      key: "api_link הוגדר",
      ok: !!apiUrl,
      detail: kv["api_link"] || "חסר",
    });
    checks.push({
      key: "api_link מצביע ל-yemot-ivr הנכון",
      ok: !!apiUrl && apiUrl.host === expectedHost && apiUrl.pathname === expectedPath,
      detail: apiUrl ? `${apiUrl.host}${apiUrl.pathname}` : "—",
    });
    const secretParam = apiUrl?.searchParams.get("secret") || "";
    const secretMatches = !!secretParam && !!webhookSecret && secretParam === webhookSecret;
    checks.push({
      key: "secret תואם ל-webhook secret",
      ok: secretMatches,
      detail: secretParam
        ? secretMatches
          ? `${"•".repeat(Math.min(secretParam.length, 8))} (תואם)`
          : "סוד שונה — הרץ הגדרה אוטומטית מחדש"
        : "חסר סוד בכתובת",
    });
    checks.push({
      key: "api_extension_send=yes",
      ok: kv["api_extension_send"] === "yes",
      detail: kv["api_extension_send"] || "חסר",
    });

    const allOk = checks.every((c) => c.ok);
    return json({
      ok: allOk,
      exists: true,
      path,
      raw,
      kv,
      expected: { host: expectedHost, path: expectedPath },
      checks,
    });
  } catch (e) {
    console.error("check-yemot-extension error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה" }, 500);
  }
});

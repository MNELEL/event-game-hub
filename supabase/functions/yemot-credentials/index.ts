// Manage per-user Yemot credentials (API token + webhook secret).
// Actions: get | save | verify | rotate_secret
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mask(token: string | null | undefined): string {
  if (!token) return "";
  const last = token.slice(-4);
  return `••••${last}`;
}

async function verifyTokenWithYemot(token: string): Promise<{ ok: boolean; message?: string; raw?: unknown }> {
  // Cheap call that requires a valid token: GetSession returns OK if token is live.
  const form = new FormData();
  form.append("token", token);
  try {
    const r = await fetch("https://www.call2all.co.il/ym/api/GetSession", {
      method: "POST",
      body: form,
    });
    const text = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    const ok = !!parsed && parsed.responseStatus === "OK";
    return { ok, message: parsed?.message, raw: parsed ?? text };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "network error" };
  }
}

function newSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const userId = userData.user.id;

    let body: { action?: string; yemot_username?: string; yemot_api_token?: string } = {};
    try { body = await req.json(); } catch {}
    const action = body.action || "get";

    const { data: existing } = await supa
      .from("yemot_credentials")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (action === "get") {
      return json({
        configured: !!existing,
        yemot_username: existing?.yemot_username ?? null,
        api_token_masked: mask(existing?.yemot_api_token),
        webhook_secret: existing?.webhook_secret ?? null,
        last_verified_at: existing?.last_verified_at ?? null,
      });
    }

    if (action === "save") {
      const username = (body.yemot_username || "").toString().trim();
      const token = (body.yemot_api_token || "").toString().trim();
      if (!token) return json({ error: "חסר אסימון API" }, 400);

      // Verify against Yemot before persisting.
      const v = await verifyTokenWithYemot(token);
      if (!v.ok) {
        return json({
          error: "האסימון לא תקין מול ימות. ודא שהעתקת אותו במלואו ושפג תוקפו לא הסתיים.",
          details: v.message || v.raw,
        }, 400);
      }

      if (existing) {
        const { error } = await supa
          .from("yemot_credentials")
          .update({
            yemot_username: username || null,
            yemot_api_token: token,
            last_verified_at: new Date().toISOString(),
          })
          .eq("owner_id", userId);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supa
          .from("yemot_credentials")
          .insert({
            owner_id: userId,
            yemot_username: username || null,
            yemot_api_token: token,
            webhook_secret: newSecret(),
            last_verified_at: new Date().toISOString(),
          });
        if (error) return json({ error: error.message }, 500);
      }
      return json({ success: true, verified: true });
    }

    if (action === "check_token") {
      const candidate = (body.yemot_api_token || "").toString().trim();
      if (!candidate || candidate.length < 8 || candidate.length > 512) {
        return json({ ok: false, message: "אסימון קצר/ארוך מדי" });
      }
      const v = await verifyTokenWithYemot(candidate);
      return json({ ok: v.ok, message: v.ok ? "תקין" : (v.message ?? "לא תקין") });
    }

    if (action === "verify") {
      if (!existing?.yemot_api_token) return json({ error: "אין אסימון שמור" }, 400);
      const v = await verifyTokenWithYemot(existing.yemot_api_token);
      if (v.ok) {
        await supa
          .from("yemot_credentials")
          .update({ last_verified_at: new Date().toISOString() })
          .eq("owner_id", userId);
      }
      return json({ ok: v.ok, message: v.message ?? null });
    }

    if (action === "rotate_secret") {
      if (!existing) return json({ error: "אין אסימונים שמורים — שמור קודם אסימון API" }, 400);
      const next = newSecret();
      const { error } = await supa
        .from("yemot_credentials")
        .update({ webhook_secret: next })
        .eq("owner_id", userId);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, webhook_secret: next, hint: "עכשיו הרץ 'הגדר את השלוחה' כדי לעדכן את ext.ini בימות." });
    }

    return json({ error: "פעולה לא מוכרת" }, 400);
  } catch (e) {
    console.error("yemot-credentials error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה" }, 500);
  }
});

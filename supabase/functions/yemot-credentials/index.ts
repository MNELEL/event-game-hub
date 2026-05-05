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

    if (action === "check_upload_permission") {
      if (!existing?.yemot_api_token) return json({ error: "אין אסימון שמור" }, 400);
      const ext = ((body as any).extension || "1").toString().replace(/[^0-9]/g, "") || "1";
      const probePath = `ivr2:/${ext}/_lovable_probe_${Date.now()}.txt`;
      const token = existing.yemot_api_token;

      const upForm = new FormData();
      upForm.append("token", token);
      upForm.append("what", probePath);
      upForm.append("contents", "lovable-permission-probe");
      const upRes = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", {
        method: "POST",
        body: upForm,
      });
      const upText = await upRes.text();
      let upJson: any = null;
      try { upJson = JSON.parse(upText); } catch {}

      const upOk = upRes.ok && (!upJson || upJson.responseStatus === "OK");
      if (!upOk) {
        const m = ((upJson?.message || "") + " " + upText).toLowerCase();
        let code = "PERMISSION_DENIED";
        let friendly = "אין הרשאת UploadTextFile לאסימון";
        let next_step = "בפאנל ימות → ניהול מערכת → API: סמן הרשאות UploadTextFile + FileAction + DownloadFile, צור אסימון חדש ושמור אותו כאן.";
        if (m.includes("not_login") || m.includes("invalid_token") || m.includes("token")) {
          code = "INVALID_TOKEN";
          friendly = "האסימון אינו תקף או שפג תוקפו";
          next_step = "צור אסימון חדש בפאנל ימות (ניהול מערכת ← API) ושמור אותו כאן.";
        } else if (m.includes("not_exists") || m.includes("not_found") || m.includes("path") || m.includes("dir")) {
          code = "EXTENSION_NOT_EXISTS";
          friendly = `שלוחה ${ext} לא קיימת בפאנל ימות`;
          next_step = `צור שלוחה ${ext} בפאנל ימות (סוג: API) ונסה שוב.`;
        } else if (m.includes("quota") || m.includes("storage")) {
          code = "QUOTA_EXCEEDED";
          friendly = "חרגת ממכסת האחסון בימות";
          next_step = "פנה אחסון בפאנל ימות ונסה שוב.";
        }
        return json({
          ok: false, can_upload: false, code, message: friendly, next_step,
          extension: ext, details: upJson || upText,
        });
      }

      let cleanup_ok = false;
      try {
        const delForm = new FormData();
        delForm.append("token", token);
        delForm.append("whatToDo", "DeleteFile");
        delForm.append("path", probePath);
        const delRes = await fetch("https://www.call2all.co.il/ym/api/FileAction", {
          method: "POST", body: delForm,
        });
        const delText = await delRes.text();
        let delJson: any = null;
        try { delJson = JSON.parse(delText); } catch {}
        cleanup_ok = delRes.ok && (!delJson || delJson.responseStatus === "OK");
      } catch (_) { cleanup_ok = false; }

      return json({
        ok: true, can_upload: true, cleanup_ok, extension: ext, probe_path: probePath,
        message: cleanup_ok
          ? "הרשאת UploadTextFile תקינה — ניתן להטמיע api_link אוטומטית"
          : `העלאת קובץ הצליחה אך מחיקת קובץ הבדיקה נכשלה (חסרה הרשאת FileAction). אפשר למחוק ידנית את ${probePath}.`,
      });
    }

    if (action === "e2e_test") {
      if (!existing?.yemot_api_token) return json({ error: "אין אסימון שמור — שמור קודם אסימון API" }, 400);
      const token = existing.yemot_api_token;
      const ext = ((body as any).extension || "1").toString().replace(/[^0-9]/g, "") || "1";
      const projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
      const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/yemot-ivr?secret=${encodeURIComponent(existing.webhook_secret)}`;

      const steps: any[] = [];
      const started = Date.now();

      // ===== Step 1: verify token via GetSession =====
      {
        const t0 = Date.now();
        const reqSummary = { endpoint: "POST https://www.call2all.co.il/ym/api/GetSession", body: { token: mask(token) } };
        let stepRes: any = { id: "verify_token", name: "1. אימות אסימון API מול ימות (GetSession)", status: "fail", request: reqSummary, duration_ms: 0 };
        try {
          const form = new FormData();
          form.append("token", token);
          const r = await fetch("https://www.call2all.co.il/ym/api/GetSession", { method: "POST", body: form });
          const text = await r.text();
          let parsed: any = null; try { parsed = JSON.parse(text); } catch {}
          stepRes.response = { http_status: r.status, body: parsed ?? text };
          if (parsed?.responseStatus === "OK") {
            stepRes.status = "ok"; stepRes.message = "האסימון תקף — מחובר לחשבון ימות";
          } else {
            stepRes.error_code = "INVALID_TOKEN";
            stepRes.message = parsed?.message || "האסימון נדחה על ידי ימות";
            stepRes.next_step = "פתח את פאנל ימות ← ניהול מערכת ← API, צור אסימון חדש והדבק כאן.";
          }
        } catch (e) {
          stepRes.error_code = "NETWORK_ERROR";
          stepRes.message = e instanceof Error ? e.message : "שגיאת רשת מול ימות";
          stepRes.next_step = "בדוק חיבור אינטרנט בשרת או שירות ימות זמני לא זמין. נסה שוב בעוד דקה.";
        }
        stepRes.duration_ms = Date.now() - t0;
        steps.push(stepRes);
        if (stepRes.status !== "ok") {
          return json({ ok: false, failed_at: stepRes.id, steps, total_ms: Date.now() - started });
        }
      }

      // ===== Step 2: probe UploadTextFile + FileAction permissions =====
      const probePath = `ivr2:/${ext}/_lovable_probe_${Date.now()}.txt`;
      {
        const t0 = Date.now();
        const reqSummary = { endpoint: "POST .../UploadTextFile", body: { token: mask(token), what: probePath, contents: "lovable-permission-probe" } };
        let stepRes: any = { id: "check_permission", name: `2. בדיקת הרשאת UploadTextFile בשלוחה ${ext}`, status: "fail", request: reqSummary, duration_ms: 0 };
        try {
          const upForm = new FormData();
          upForm.append("token", token);
          upForm.append("what", probePath);
          upForm.append("contents", "lovable-permission-probe");
          const upRes = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", { method: "POST", body: upForm });
          const upText = await upRes.text();
          let upJson: any = null; try { upJson = JSON.parse(upText); } catch {}
          stepRes.response = { http_status: upRes.status, body: upJson ?? upText };
          const upOk = upRes.ok && (!upJson || upJson.responseStatus === "OK");
          if (upOk) {
            // try cleanup
            let cleanup_ok = false;
            try {
              const delForm = new FormData();
              delForm.append("token", token); delForm.append("whatToDo", "DeleteFile"); delForm.append("path", probePath);
              const delRes = await fetch("https://www.call2all.co.il/ym/api/FileAction", { method: "POST", body: delForm });
              const delText = await delRes.text();
              let delJson: any = null; try { delJson = JSON.parse(delText); } catch {}
              cleanup_ok = delRes.ok && (!delJson || delJson.responseStatus === "OK");
              stepRes.cleanup = { ok: cleanup_ok, body: delJson ?? delText };
            } catch (_) {}
            stepRes.status = "ok";
            stepRes.message = cleanup_ok
              ? "ניתן לכתוב ולמחוק קבצים בשלוחה — הרשאות מלאות"
              : `העלאה הצליחה אך מחיקת קובץ הבדיקה נכשלה — חסרה הרשאת FileAction. אפשר למחוק ידנית: ${probePath}`;
          } else {
            const m = ((upJson?.message || "") + " " + upText).toLowerCase();
            if (m.includes("not_login") || m.includes("invalid_token")) {
              stepRes.error_code = "INVALID_TOKEN";
              stepRes.message = "האסימון פג תוקף בין השלבים";
              stepRes.next_step = "צור אסימון חדש בפאנל ימות ושמור כאן.";
            } else if (m.includes("not_exists") || m.includes("not_found") || m.includes("path") || m.includes("dir")) {
              stepRes.error_code = "EXTENSION_NOT_EXISTS";
              stepRes.message = `שלוחה ${ext} לא קיימת בפאנל ימות`;
              stepRes.next_step = `פתח פאנל ימות ← שלוחות, צור שלוחה ${ext} מסוג API, ונסה שוב.`;
            } else if (m.includes("quota") || m.includes("storage")) {
              stepRes.error_code = "QUOTA_EXCEEDED";
              stepRes.message = "חרגת ממכסת אחסון בימות";
              stepRes.next_step = "פנה אחסון בפאנל ימות ונסה שוב.";
            } else {
              stepRes.error_code = "PERMISSION_DENIED";
              stepRes.message = "אין הרשאת UploadTextFile לאסימון";
              stepRes.next_step = "בפאנל ימות ← ניהול מערכת ← API: סמן UploadTextFile + FileAction + DownloadFile, צור אסימון חדש ושמור.";
            }
          }
        } catch (e) {
          stepRes.error_code = "NETWORK_ERROR";
          stepRes.message = e instanceof Error ? e.message : "שגיאת רשת";
          stepRes.next_step = "נסה שוב בעוד דקה.";
        }
        stepRes.duration_ms = Date.now() - t0;
        steps.push(stepRes);
        if (stepRes.status !== "ok") {
          return json({ ok: false, failed_at: stepRes.id, steps, total_ms: Date.now() - started });
        }
      }

      // ===== Step 3: write actual ext.ini =====
      {
        const t0 = Date.now();
        const path = `ivr2:/${ext}/ext.ini`;
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
        const iniMasked = iniContent.replace(/secret=([^&\s]+)/, (_, s) => `secret=••••${String(s).slice(-4)}`);
        const reqSummary = { endpoint: "POST .../UploadTextFile", body: { token: mask(token), what: path, contents: iniMasked } };
        let stepRes: any = { id: "write_ext_ini", name: `3. כתיבת ext.ini בשלוחה ${ext}`, status: "fail", request: reqSummary, duration_ms: 0 };
        try {
          const form = new FormData();
          form.append("token", token); form.append("what", path); form.append("contents", iniContent);
          const r = await fetch("https://www.call2all.co.il/ym/api/UploadTextFile", { method: "POST", body: form });
          const text = await r.text();
          let parsed: any = null; try { parsed = JSON.parse(text); } catch {}
          stepRes.response = { http_status: r.status, body: parsed ?? text };
          if (r.ok && (!parsed || parsed.responseStatus === "OK")) {
            stepRes.status = "ok";
            stepRes.message = `ext.ini נכתב בהצלחה בשלוחה ${ext}. חייג עכשיו לבדיקה.`;
            stepRes.path = path;
          } else {
            stepRes.error_code = "WRITE_FAILED";
            stepRes.message = parsed?.message || "כתיבת ext.ini נכשלה";
            stepRes.next_step = "ודא שלשלוחה הוגדר סוג 'API' (ולא טריוויה/IVR2) ושההרשאות תקינות.";
          }
        } catch (e) {
          stepRes.error_code = "NETWORK_ERROR";
          stepRes.message = e instanceof Error ? e.message : "שגיאת רשת";
        }
        stepRes.duration_ms = Date.now() - t0;
        steps.push(stepRes);
      }

      const allOk = steps.every((s) => s.status === "ok");
      return json({ ok: allOk, failed_at: allOk ? null : steps.find((s) => s.status !== "ok")?.id, steps, total_ms: Date.now() - started });
    }

    return json({ error: "פעולה לא מוכרת" }, 400);
  } catch (e) {
    console.error("yemot-credentials error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה" }, 500);
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, ...extra, "Content-Type": "application/json" } });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "options", "correctAnswer", "category"],
        properties: {
          text: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswer: { type: "integer" },
          category: { type: "string" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "יש להתחבר כמנהל" }, 401);
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u, error: ue } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (ue || !u?.user) return json({ error: "יש להתחבר כמנהל" }, 401);

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic ?? "").trim().slice(0, 6000);
    const eventType = String(body.eventType ?? "").trim().slice(0, 100);
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 20);
    const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : "medium";
    if (topic.length < 2) return json({ error: "יש להזין נושא או טקסט" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "שירות ה-AI לא מוגדר" }, 500);

    const diffHe = { easy: "קלה", medium: "בינונית", hard: "קשה" }[difficulty as "easy"];
    const instructions =
      `אתה כותב שאלות טריוויה בעברית תקנית לאירועים. צור בדיוק ${count} שאלות ברמת קושי ${diffHe}${eventType ? ` המתאימות לאירוע מסוג "${eventType}" (טון, שפה ותכנים מתאימים לקהל)` : ""}. ` +
      `לכל שאלה בדיוק 4 תשובות קצרות (עד 8 מילים), תשובה נכונה אחת בלבד ומסיחים סבירים. ` +
      `correctAnswer הוא אינדקס 0-3 של התשובה הנכונה; פזר את מיקום התשובה הנכונה. ` +
      `category: שם קטגוריה קצר בעברית. אם ניתן טקסט מקור – בסס את השאלות רק עליו. הקפד על עובדות נכונות. ` +
      `הקהל הוא הציבור החרדי: כתוב רק שאלות שמתאימות לרוח התורה והמסורת היהודית – תורה, חז"ל, הלכה, מועדים, ארץ ישראל, גדולי ישראל, ידע כללי נקי, טבע, חשבון ושאלות כיף משפחתיות. ` +
      `אסור לחלוטין: מנהגים של דתות ועמים אחרים, פילוסופיה, אמונות זרות, מיתולוגיה, תרבות פופ חילונית (סרטים, סדרות, זמרים, מוזיקה קלאסית ומלחינים), ספורט מקצועני, אופנה, זוגיות ורומנטיקה, ותכנים לא צנועים. ` +
      `אם הנושא שהתבקש אינו מתאים – כתוב שאלות קרובות ומתאימות במקומו.`;

    const runId = req.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: `נושא / טקסט:\n${topic}`,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "trivia", strict: true, schema } },
      }),
    });
    const aig: Record<string, string> = {};
    const rid = res.headers.get("X-Lovable-AIG-Run-ID");
    if (rid) aig["X-Lovable-AIG-Run-ID"] = rid;

    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      let msg = "יצירת השאלות נכשלה";
      try { msg = JSON.parse(t)?.error?.message || JSON.parse(t)?.message || msg; } catch {}
      if (res.status === 429) msg = "יותר מדי בקשות, נסו שוב בעוד דקה";
      if (res.status === 402) msg = msg || "נגמרו קרדיטי ה-AI";
      return json({ error: msg }, res.status, aig);
    }

    // Consume SSE stream, collect output text
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "", failed = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") failed = "הבקשה נדחתה על ידי המודל";
          else if (ev.type === "response.failed" || ev.type === "error")
            failed = ev.response?.error?.message || ev.message || "יצירת השאלות נכשלה";
        } catch {}
      }
    }
    if (failed) return json({ error: failed }, 502, aig);
    if (!out.trim()) return json({ error: "המודל לא החזיר שאלות" }, 502, aig);

    const parsed = JSON.parse(out);
    const questions = (parsed.questions ?? [])
      .filter((q: any) => q?.text && Array.isArray(q.options) && q.options.length >= 2)
      .map((q: any) => {
        const options = q.options.slice(0, 4).map((o: unknown) => String(o));
        while (options.length < 4) options.push("—");
        const c = Number(q.correctAnswer);
        return { text: String(q.text), options, correctAnswer: c >= 0 && c < 4 ? c : 0, category: String(q.category || "כללי") };
      });
    return json({ questions }, 200, aig);
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: cors });
    console.error(e);
    return json({ error: "שגיאה ביצירת השאלות" }, 500);
  }
});

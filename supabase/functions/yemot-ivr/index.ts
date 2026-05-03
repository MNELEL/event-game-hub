// Yemot HaMashiach IVR webhook (api_call protocol)
// Public endpoint, secured via ?secret=YEMOT_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Yemot api_call: response is plain text. Commands separated by &.
// After commands finish playing, Yemot will call the URL again automatically.
function ymResp(commands: string[]): Response {
  const body = commands.join("&");
  console.log("[yemot-ivr] →", body);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Sanitize text for t- TTS (avoid characters that break the protocol)
function tts(text: string): string {
  return "t-" + text.replace(/[.,&=]/g, " ");
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    if (!SECRET || secret !== SECRET) {
      return ymResp([
        `id_list_message=${tts("שגיאת אבטחה. אנא פנה למנהל המערכת.")}`,
        "hangup=yes",
      ]);
    }

    // Yemot sends all params in the query string for GET api_call
    const params = url.searchParams;
    console.log("[yemot-ivr] ←", Object.fromEntries(params.entries()));

    const phone = params.get("ApiPhone") || params.get("ApiCallerId") || "";
    // ApiYFLastInput is the latest digits the user pressed; falsy on first hit
    const lastInput = (params.get("ApiYFLastInput") || "").trim();

    if (!phone) {
      return ymResp([
        `id_list_message=${tts("לא זוהה מספר מתקשר.")}`,
        "hangup=yes",
      ]);
    }

    // 1) Join (idempotent) and get current state
    const { data: joinData, error: joinErr } = await admin.rpc("join_phone_player", {
      p_phone: phone,
    });

    if (joinErr || !joinData || joinData.length === 0) {
      console.error("[yemot-ivr] join error", joinErr);
      const msg = joinErr?.message?.includes("no_active_game")
        ? "אין משחק פעיל כרגע. אנא נסה שוב מאוחר יותר."
        : "אירעה שגיאה. אנא נסה שוב.";
      return ymResp([`id_list_message=${tts(msg)}`, "hangup=yes"]);
    }

    const state = joinData[0] as {
      player_id: string;
      game_id: string;
      status: string;
      current_question_index: number;
      time_remaining: number;
      question_ids: string[];
    };

    // 2) Handle answer submission if in question state and we got a digit
    if (lastInput && state.status === "question") {
      const digit = parseInt(lastInput, 10);
      if (digit >= 1 && digit <= 4) {
        await admin.rpc("submit_phone_answer", {
          p_phone: phone,
          p_question_index: state.current_question_index,
          p_answer: digit,
        });
        // Acknowledge and let Yemot re-poll us automatically
        return ymResp([
          `id_list_message=${tts("תשובתך נקלטה. ממתין לשאלה הבאה.")}`,
        ]);
      }
    }

    // 3) Branch by game status. NEVER use go_to_folder=/ — it would
    // kick the caller out of the api_call extension. Just return a
    // message; Yemot will call this URL again after playback.
    switch (state.status) {
      case "lobby": {
        const isFirst = !lastInput && !params.get("ApiTimeOut");
        const msg = isFirst
          ? `הצטרפת בהצלחה. אתה רשום בשם מתקשר ${phone.slice(-4)}. ממתין לתחילת המשחק.`
          : "ממתין לתחילת המשחק.";
        return ymResp([`id_list_message=${tts(msg)}`]);
      }

      case "question": {
        const qNum = state.current_question_index + 1;
        const total = state.question_ids?.length || 0;
        const timeout = Math.max(3, Math.min(state.time_remaining || 15, 60));
        // read=prompt,var,tap,length,blockAsterisk,minDigit,maxDigit,sec_timeout,...
        return ymResp([
          `read=${tts(`שאלה מספר ${qNum} מתוך ${total}. הקש ספרה בין אחת לארבע.`)},answer,tap,1,no,1,4,${timeout},no,no`,
        ]);
      }

      case "results":
      case "leaderboard":
        return ymResp([
          `id_list_message=${tts("ממתין לשאלה הבאה.")}`,
        ]);

      case "playing":
        return ymResp([
          `id_list_message=${tts("המשחק מתחיל. ממתין לשאלה.")}`,
        ]);

      case "finished":
      default:
        return ymResp([
          `id_list_message=${tts("המשחק הסתיים. תודה על ההשתתפות.")}`,
          "hangup=yes",
        ]);
    }
  } catch (e) {
    console.error("yemot-ivr error", e);
    return ymResp([
      `id_list_message=${tts("שגיאה בלתי צפויה.")}`,
      "hangup=yes",
    ]);
  }
});

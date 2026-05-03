// Yemot HaMashiach IVR webhook (api_call protocol)
// Public endpoint, secured via ?secret=YEMOT_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Yemot expects plain text response, commands separated by &
function ymResp(commands: string[]): Response {
  return new Response(commands.join("&"), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Escape Hebrew text for id_list_message t- TTS
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

    const phone = url.searchParams.get("ApiPhone") || url.searchParams.get("ApiCallerId") || "";
    const lastInput = url.searchParams.get("ApiYFLastInput") || "";

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
      const msg = joinErr?.message === "no_active_game"
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

    // First call (no input yet) — welcome
    const isFirstHit = !lastInput && !url.searchParams.get("ApiTimeOut");

    // 2) Handle answer submission if we have input and game is in question state
    if (lastInput && state.status === "question") {
      const digit = parseInt(lastInput, 10);
      if (digit >= 1 && digit <= 4) {
        await admin.rpc("submit_phone_answer", {
          p_phone: phone,
          p_question_index: state.current_question_index,
          p_answer: digit,
        });
      }
      // After submission, loop back to wait for next question
      return ymResp([
        `id_list_message=${tts("תשובתך נקלטה. ממתין לשאלה הבאה.")}`,
        "go_to_folder=/",
      ]);
    }

    // 3) Branch by game status
    switch (state.status) {
      case "lobby":
        return ymResp([
          `id_list_message=${tts(isFirstHit
            ? `הצטרפת בהצלחה. אתה רשום בשם מתקשר ${phone.slice(-4)}. ממתין לתחילת המשחק.`
            : "ממתין לתחילת המשחק.")}`,
          "go_to_folder=/",
        ]);

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
          "go_to_folder=/",
        ]);

      case "playing":
        return ymResp([
          `id_list_message=${tts("המשחק מתחיל. ממתין לשאלה.")}`,
          "go_to_folder=/",
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

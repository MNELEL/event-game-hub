// Yemot HaMashiach IVR webhook (type=api protocol)
// Public endpoint, secured via ?secret=YEMOT_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Yemot API module response is plain text. Commands separated by &.
function ymResp(commands: string[]): Response {
  const body = commands.join("&") + "&";
  console.log("[yemot-ivr] →", body);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Sanitize text for t- TTS (avoid characters that break the protocol)
function tts(text: string): string {
  return "t-" + text.replace(/[.\-"'&|=,]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

function hangupMessage(text: string): string {
  return `id_list_message=${tts(text)}.g-hangup`;
}

function waitRead(text: string, valName: string, seconds = 5): string {
  // read=<messages>=<val_name>,<re-enter>,<max>,<min>,<sec_wait>,<playback>,<block_*>,<block_0>,<replace>,<allowed>,<attempts>,<allow_empty>,<empty_val>
  return `read=${tts(text)}=${valName},no,1,1,${seconds},No,yes,no,,9,1,Ok,None`;
}

function answerRead(text: string, valName: string, seconds: number): string {
  return `read=${tts(text)}=${valName},no,1,1,${seconds},No,yes,no,,1.2.3.4,1,Ok,None`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    if (!SECRET || secret !== SECRET) {
      return ymResp([hangupMessage("שגיאת אבטחה. אנא פנה למנהל המערכת.")]);
    }

    // Yemot sends all params in the query string for GET type=api
    const params = url.searchParams;
    console.log("[yemot-ivr] ←", Object.fromEntries(params.entries()));

    const phone = cleanPhone(params.get("ApiPhone") || params.get("Phone") || params.get("ApiCallerId") || "");

    if (!phone) {
      return ymResp([hangupMessage("לא זוהה מספר מתקשר.")]);
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
      return ymResp([hangupMessage(msg)]);
    }

    const state = joinData[0] as {
      player_id: string;
      game_id: string;
      status: string;
      current_question_index: number;
      time_remaining: number;
      question_ids: string[];
    };

    const { data: phoneRows } = await admin
      .from("phone_players")
      .select("created_at,last_question_index")
      .eq("phone", phone)
      .eq("game_id", state.game_id)
      .limit(1);
    const phoneRow = phoneRows?.[0] as { created_at?: string; last_question_index?: number } | undefined;
    const joinedSecondsAgo = phoneRow?.created_at
      ? (Date.now() - new Date(phoneRow.created_at).getTime()) / 1000
      : 999;
    const justJoined = joinedSecondsAgo < 12;

    // 2) Handle answer submission. Use a per-question variable so old digits
    // are never reused automatically on the next question.
    const answerVar = `q${state.current_question_index}`;
    const answerInput = (params.get(answerVar) || params.get("answer") || params.get("ApiYFLastInput") || "").trim();
    if (answerInput && state.status === "question") {
      const digit = parseInt(answerInput, 10);
      if (digit >= 1 && digit <= 4) {
        const { data: answerData, error: answerErr } = await admin.rpc("submit_phone_answer", {
          p_phone: phone,
          p_question_index: state.current_question_index,
          p_answer: digit,
        });
        if (answerErr) console.error("[yemot-ivr] answer error", answerErr);
        const accepted = Array.isArray(answerData) && answerData[0]?.accepted;
        return ymResp([waitRead(accepted ? "תשובתך נקלטה. ממתין לשאלה הבאה." : "כבר נקלטה תשובה לשאלה זו. ממתין לשאלה הבאה.", `wait${state.current_question_index}`, 5)]);
      }
    }

    const introVar = `joined${state.current_question_index}`;
    if (justJoined && !params.has(introVar)) {
      return ymResp([waitRead(`הצטרפת בהצלחה. אתה רשום בשם מתקשר ${phone.slice(-4)}.`, introVar, 3)]);
    }

    // 3) Branch by game status. Waiting states use read with timeout so Yemot
    // calls us again and stays synchronized with the host screen.
    switch (state.status) {
      case "lobby": {
        return ymResp([waitRead("ממתין לתחילת המשחק.", "lobby_wait", 5)]);
      }

      case "question": {
        const qNum = state.current_question_index + 1;
        const total = state.question_ids?.length || 0;
        const timeout = Math.max(3, Math.min(state.time_remaining || 15, 60));
        return ymResp([
          answerRead(`שאלה מספר ${qNum} מתוך ${total}. הקש ספרה בין אחת לארבע.`, answerVar, timeout),
        ]);
      }

      case "results":
      case "leaderboard":
        return ymResp([waitRead("ממתין לשאלה הבאה.", "between_wait", 5)]);

      case "playing":
        return ymResp([waitRead("המשחק מתחיל. ממתין לשאלה.", "playing_wait", 3)]);

      case "finished":
      default:
        return ymResp([hangupMessage("המשחק הסתיים. תודה על ההשתתפות.")]);
    }
  } catch (e) {
    console.error("yemot-ivr error", e);
    return ymResp([hangupMessage("שגיאה בלתי צפויה.")]);
  }
});

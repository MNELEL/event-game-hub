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

// Short poll cycle keeps the IVR re-checking server state so it can advance
// to the next question (or react to status changes) within a few seconds.
const POLL_SECONDS = 3;

function waitRead(text: string, valName: string, seconds = POLL_SECONDS): string {
  // read=<messages>=<val_name>,<re-enter>,<max>,<min>,<sec_wait>,<playback>,<block_*>,<block_0>,<replace>,<allowed>,<attempts>,<allow_empty>,<empty_val>
  return `read=${tts(text)}=${valName},no,1,1,${seconds},No,yes,no,,9,1,Ok,None`;
}

function answerRead(text: string, valName: string, seconds: number): string {
  return `read=${tts(text)}=${valName},no,1,1,${seconds},No,yes,no,,1.2.3.4,1,Ok,None`;
}

// Silent short re-poll (no TTS) — used to align quickly with host state changes
function silentPoll(valName: string, seconds = POLL_SECONDS): string {
  return `read=t-=${valName},no,1,1,${seconds},No,yes,no,,9,1,Ok,None`;
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
      .select("created_at,last_question_index,joined_in_lobby")
      .eq("phone", phone)
      .eq("game_id", state.game_id)
      .limit(1);
    const phoneRow = phoneRows?.[0] as { created_at?: string; last_question_index?: number; joined_in_lobby?: boolean } | undefined;
    const joinedSecondsAgo = phoneRow?.created_at
      ? (Date.now() - new Date(phoneRow.created_at).getTime()) / 1000
      : 999;
    const justJoined = joinedSecondsAgo < 12;
    const joinedInLobby = phoneRow?.joined_in_lobby === true;

    const lastAnsweredIdx = phoneRow?.last_question_index ?? -1;
    const alreadyAnsweredCurrent = lastAnsweredIdx >= state.current_question_index;

    // Caller didn't register during the lobby — they must wait for the next game.
    if (!joinedInLobby) {
      if (state.status === "finished") {
        return ymResp([hangupMessage(`המשחק הסתיים. נרשמת בשם מתקשר ${phone.slice(-4)}. תוכל להשתתף במשחק הבא. תודה רבה.`)]);
      }

      const total = state.question_ids?.length || 0;
      const qNum = state.current_question_index + 1;
      const remainingQs = Math.max(0, total - qNum);

      let progress = "המשחק בעיצומו";
      if (state.status === "lobby" || state.status === "playing") {
        progress = "המשחק עומד להתחיל";
      } else if (state.status === "question") {
        progress = `כעת מתקיימת שאלה ${qNum} מתוך ${total}`;
      } else if (state.status === "results" || state.status === "leaderboard") {
        progress = `הסתיימה שאלה ${qNum} מתוך ${total}`;
      }
      const tail = remainingQs > 0
        ? `נותרו ${remainingQs} שאלות עד סיום המשחק. תוכל לענות במשחק הבא שיתחיל לאחר סיום זה.`
        : `המשחק לקראת סיום. תוכל לענות במשחק הבא שיתחיל בקרוב.`;

      // Repeat the reminder every ~30 seconds based on elapsed time since the
      // caller joined. Between reminders we silently poll so we react instantly
      // when the host starts a new game.
      const cycle = Math.floor(joinedSecondsAgo / 30);
      const reminderVar = `late_msg_${cycle}`;
      if (!params.has(reminderVar)) {
        const intro = cycle === 0
          ? `שלום, נרשמת בשם מתקשר ${phone.slice(-4)}. ${progress}. הצטרפת לאחר תחילת המשחק ולכן לא תוכל לענות על השאלות הנוכחיות. ${tail} אנא הישאר על הקו עד תחילת המשחק הבא.`
          : `${progress}. ${tail}`;
        return ymResp([waitRead(intro, reminderVar, cycle === 0 ? 8 : 6)]);
      }

      return ymResp([silentPoll(`late_wait_${cycle}`)]);
    }

    // 2) Handle answer submission. Use a per-question variable so old digits
    // are never reused automatically on the next question.
    const answerVar = `q${state.current_question_index}`;
    const answerInput = (params.get(answerVar) || "").trim();
    if (answerInput && state.status === "question" && !alreadyAnsweredCurrent) {
      const digit = parseInt(answerInput, 10);
      if (digit >= 1 && digit <= 4) {
        const { data: answerData, error: answerErr } = await admin.rpc("submit_phone_answer", {
          p_phone: phone,
          p_question_index: state.current_question_index,
          p_answer: digit,
        });
        if (answerErr) console.error("[yemot-ivr] answer error", answerErr);
        const accepted = Array.isArray(answerData) && answerData[0]?.accepted;
        return ymResp([waitRead(accepted ? "תשובתך נקלטה." : "כבר נקלטה תשובה.", `ack${state.current_question_index}`, 2)]);
      }
    }

    const introVar = `joined_intro`;
    if (justJoined && !params.has(introVar)) {
      return ymResp([waitRead(`הצטרפת בהצלחה. אתה רשום בשם מתקשר ${phone.slice(-4)}.`, introVar, 3)]);
    }

    // 3) Branch by game status. Short polling keeps every state in sync with
    // the host screen — when the host advances/changes timing we react within
    // POLL_SECONDS.
    switch (state.status) {
      case "lobby":
        return ymResp([silentPoll("lobby_wait")]);

      case "playing":
        return ymResp([silentPoll("playing_wait")]);

      case "question": {
        // Already answered this question? Just wait silently for the next one.
        if (alreadyAnsweredCurrent) {
          return ymResp([silentPoll(`done${state.current_question_index}`)]);
        }
        const qNum = state.current_question_index + 1;
        const total = state.question_ids?.length || 0;
        // Cap timeout to POLL_SECONDS so we re-sync if host changes the timer
        // or moves to the next question early. Yemot will keep re-asking
        // the same question variable until the caller types a digit.
        const remaining = Math.max(1, state.time_remaining || POLL_SECONDS);
        const timeout = Math.min(remaining, POLL_SECONDS);
        return ymResp([
          answerRead(`שאלה ${qNum} מתוך ${total}. הקש בין אחת לארבע.`, answerVar, timeout),
        ]);
      }

      case "results":
      case "leaderboard":
        return ymResp([silentPoll("between_wait")]);

      case "finished":
      default:
        return ymResp([hangupMessage("המשחק הסתיים. תודה על ההשתתפות.")]);
    }
  } catch (e) {
    console.error("yemot-ivr error", e);
    return ymResp([hangupMessage("שגיאה בלתי צפויה.")]);
  }
});

// Yemot HaMashiach IVR webhook (type=api protocol)
// Public endpoint, secured via ?secret=YEMOT_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  cleanPhone,
  decideIvrResponse,
  renderDecision,
  type Decision,
  type GameState,
  type PhoneRow,
} from "./logic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("YEMOT_WEBHOOK_SECRET") || "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function ymResp(decisions: Decision[]): Response {
  const body = decisions.map(renderDecision).join("&") + "&";
  console.log("[yemot-ivr] →", body);
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    if (!SECRET || secret !== SECRET) {
      return ymResp([{ kind: "hangup", text: "שגיאת אבטחה. אנא פנה למנהל המערכת." }]);
    }

    const params = url.searchParams;
    console.log("[yemot-ivr] ←", Object.fromEntries(params.entries()));

    const phone = cleanPhone(
      params.get("ApiPhone") || params.get("Phone") || params.get("ApiCallerId") || ""
    );
    if (!phone) {
      return ymResp([{ kind: "hangup", text: "לא זוהה מספר מתקשר." }]);
    }

    const { data: joinData, error: joinErr } = await admin.rpc("join_phone_player", {
      p_phone: phone,
    });
    if (joinErr || !joinData || joinData.length === 0) {
      console.error("[yemot-ivr] join error", joinErr);
      const text = joinErr?.message?.includes("no_active_game")
        ? "אין משחק פעיל כרגע. אנא נסה שוב מאוחר יותר."
        : "אירעה שגיאה. אנא נסה שוב.";
      return ymResp([{ kind: "hangup", text }]);
    }

    const state = joinData[0] as GameState;

    // Log auto-recovery cases (host pressed Start before caller dialed in,
    // but caller still made it into the first-question grace window).
    if (
      state.status !== "lobby" &&
      typeof (state as any).current_question_index === "number" &&
      (state as any).current_question_index === 0
    ) {
      console.log(
        "[yemot-ivr] caller likely admitted via first-question grace window",
        { phoneTail: phone.slice(-4), status: state.status, gameId: state.game_id }
      );
    }

    // Fetch start_at + settings (for title) so we can announce the game.
    const { data: gameRow } = await admin
      .from("games")
      .select("start_at,settings,question_ids,current_question_index")
      .eq("id", state.game_id)
      .maybeSingle();
    const g = gameRow as
      | { start_at: string | null; settings: any; question_ids: string[]; current_question_index: number }
      | null;
    state.start_at = g?.start_at ?? null;
    state.game_title = (g?.settings && typeof g.settings === "object")
      ? (g.settings.title as string | undefined) ?? null
      : null;

    // Fetch the current question text + options so the IVR can read it aloud.
    state.current_question = null;
    if (g && Array.isArray(g.question_ids) && g.question_ids[g.current_question_index]) {
      const qid = g.question_ids[g.current_question_index];
      const { data: qRow } = await admin
        .from("questions")
        .select("text,options")
        .eq("id", qid)
        .maybeSingle();
      if (qRow) {
        state.current_question = {
          text: (qRow as any).text as string,
          options: ((qRow as any).options as string[]) || [],
        };
      }
    }

    const { data: phoneRows } = await admin
      .from("phone_players")
      .select("created_at,last_question_index,last_seen_question_index,joined_in_lobby")
      .eq("phone", phone)
      .eq("game_id", state.game_id)
      .limit(1);
    const phoneRow = phoneRows?.[0] as PhoneRow | undefined;

    let decision = decideIvrResponse({ phone, params, state, phoneRow });

    if (decision.kind === "submitAnswer") {
      const { data: answerData, error: answerErr } = await admin.rpc("submit_phone_answer", {
        p_phone: phone,
        p_question_index: decision.questionIndex,
        p_answer: decision.digit,
      });
      if (answerErr) console.error("[yemot-ivr] answer error", answerErr);
      const accepted = Array.isArray(answerData) && answerData[0]?.accepted === true;
      decision = decideIvrResponse({
        phone,
        params,
        state,
        phoneRow,
        answerSubmission: { digit: decision.digit, accepted },
      });
    }

    // Heartbeat: record that the IVR is actively polling for this caller and
    // which question index it currently sees. Powers the host's live "IVR sync"
    // indicator. Best-effort — never block the response.
    admin
      .from("phone_players")
      .update({
        last_poll_at: new Date().toISOString(),
        last_seen_question_index: state.current_question_index,
      })
      .eq("phone", phone)
      .eq("game_id", state.game_id)
      .then(({ error }) => {
        if (error) console.error("[yemot-ivr] heartbeat error", error);
      });

    return ymResp([decision]);
  } catch (e) {
    console.error("yemot-ivr error", e);
    return ymResp([{ kind: "hangup", text: "שגיאה בלתי צפויה." }]);
  }
});

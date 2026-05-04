// IVR Simulator — host-only "test call" endpoint.
//
// Dry-runs the same pure decision logic the live Yemot webhook uses, against the
// host's currently active game state. Never writes to the database, never
// creates a phone_player row, and never submits an answer.
//
// Returns:
//   - The exact Hebrew TTS the caller would hear
//   - The decision kind (wait/answer/silent/hangup/submitAnswer)
//   - The classification of how the caller would join (normal/recovery/late)
//
// Authentication: requires a logged-in user JWT. The user must own
// (created_by = auth.uid()) the active game being inspected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  cleanPhone,
  classifyJoiner,
  decideIvrResponse,
  type Decision,
  type GameState,
  type GameStatus,
  type JoinerKind,
  type PhoneRow,
} from "../yemot-ivr/logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function describeDecision(d: Decision): { kind: string; text: string; seconds?: number } {
  switch (d.kind) {
    case "hangup":
      return { kind: "hangup", text: d.text };
    case "wait":
      return { kind: "wait", text: d.text, seconds: d.seconds };
    case "answer":
      return { kind: "answer", text: d.text, seconds: d.seconds };
    case "silent":
      return { kind: "silent", text: "(שתיקה — מעבר לסקר הבא)", seconds: d.seconds };
    case "submitAnswer":
      return { kind: "submitAnswer", text: `יישלח ספרה ${d.digit} כתשובה לשאלה ${d.questionIndex + 1}` };
  }
}

function describeJoiner(k: JoinerKind): string {
  switch (k) {
    case "normal":   return "מתקשר רגיל — נרשם בלובי, יוכל לענות.";
    case "recovery": return "מתקשר משוחזר — חייג אחרי 'הפעלה' אך הספיק לשאלה הראשונה.";
    case "late":     return "מתקשר מאוחר — לא יוכל לענות במשחק הנוכחי, ימתין למשחק הבא.";
    case "absent":   return "מתקשר לא רשום — עדיין לא חייג למערכת.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Auth: require a real user JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // ── Body ──
    type Body = {
      phone?: string;
      action?: "join" | "answer";
      digit?: number;
      // Optional: simulate a specific game; defaults to the user's most recent active game.
      game_id?: string;
    };
    let body: Body = {};
    try { body = (await req.json()) as Body; } catch {}

    const phone = cleanPhone(body.phone || "0500000000");
    if (!phone || phone.length < 4) {
      return json({ error: "מספר טלפון לא תקין" }, 400);
    }
    const action = body.action ?? "join";
    const digit = typeof body.digit === "number" ? body.digit : undefined;
    if (action === "answer" && (!digit || digit < 1 || digit > 4)) {
      return json({ error: "ספרת תשובה חייבת להיות 1, 2, 3 או 4" }, 400);
    }

    // ── Find the host's active game ──
    let gameQ = admin
      .from("games")
      .select("id,status,current_question_index,time_remaining,question_ids,start_at,settings,created_by")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (body.game_id) {
      gameQ = admin
        .from("games")
        .select("id,status,current_question_index,time_remaining,question_ids,start_at,settings,created_by")
        .eq("id", body.game_id)
        .eq("created_by", userId)
        .limit(1);
    }
    const { data: gameRows, error: gameErr } = await gameQ;
    if (gameErr) return json({ error: gameErr.message }, 500);
    const game = gameRows?.[0];
    if (!game) {
      return json({ error: "לא נמצא משחק פעיל בבעלותך — צור משחק לפני בדיקה." }, 404);
    }

    // ── Build the GameState the IVR would see ──
    const state: GameState = {
      player_id: "sim-player",
      game_id: game.id as string,
      status: game.status as GameStatus,
      current_question_index: (game.current_question_index as number) ?? 0,
      time_remaining: (game.time_remaining as number) ?? 15,
      question_ids: (game.question_ids as string[]) ?? [],
      start_at: (game.start_at as string | null) ?? null,
      game_title: (game.settings && typeof game.settings === "object")
        ? ((game.settings as Record<string, unknown>).title as string | undefined) ?? null
        : null,
      current_question: null,
    };

    // Load current question text + options if available.
    if (state.question_ids[state.current_question_index]) {
      const qid = state.question_ids[state.current_question_index];
      const { data: qRow } = await admin
        .from("questions")
        .select("text,options")
        .eq("id", qid)
        .maybeSingle();
      if (qRow) {
        state.current_question = {
          text: (qRow as { text: string }).text,
          options: ((qRow as { options: string[] }).options) || [],
        };
      }
    }

    // ── Look up the real phone_players row IF it exists (read-only) ──
    const { data: phoneRows } = await admin
      .from("phone_players")
      .select("created_at,last_question_index,last_seen_question_index,joined_in_lobby")
      .eq("phone", phone)
      .eq("game_id", state.game_id)
      .limit(1);
    let phoneRow = phoneRows?.[0] as PhoneRow | undefined;

    // If no real row, simulate one matching what `join_phone_player` would do
    // RIGHT NOW for this caller (without persisting). This way the host can
    // preview what a fresh caller would experience.
    let simulated = false;
    if (!phoneRow) {
      simulated = true;
      const inLobby =
        state.status === "lobby" &&
        (!state.start_at || Date.now() < new Date(state.start_at).getTime());
      phoneRow = {
        created_at: new Date().toISOString(),
        last_question_index: -1,
        last_seen_question_index: undefined,
        joined_in_lobby: inLobby,
      };
    }

    const joinerKind = classifyJoiner(state, phoneRow);

    // ── Build URL params the way Yemot would send them on a fresh call ──
    const params = new URLSearchParams();
    if (action === "answer" && typeof digit === "number") {
      params.set(`q${state.current_question_index}`, String(digit));
    }

    let decision = decideIvrResponse({ phone, params, state, phoneRow });

    // If submit, run a second pass with answerSubmission as the live function would.
    let secondPass: Decision | null = null;
    if (decision.kind === "submitAnswer") {
      secondPass = decideIvrResponse({
        phone,
        params,
        state,
        phoneRow,
        answerSubmission: { digit: decision.digit, accepted: true /* dry-run assumes accepted */ },
      });
    }

    return json({
      ok: true,
      simulated,
      phone_tail: phone.slice(-4),
      game: {
        id: state.game_id,
        status: state.status,
        question_index: state.current_question_index,
        question_total: state.question_ids.length,
        start_at: state.start_at,
      },
      joiner: {
        kind: joinerKind,
        description: describeJoiner(joinerKind),
      },
      first_decision: describeDecision(decision),
      second_decision: secondPass ? describeDecision(secondPass) : null,
    });
  } catch (e) {
    console.error("yemot-ivr-simulate error", e);
    return json({ error: e instanceof Error ? e.message : "שגיאה לא צפויה" }, 500);
  }
});

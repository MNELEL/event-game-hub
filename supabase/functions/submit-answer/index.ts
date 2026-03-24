import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { player_id, game_id, question_id, answer, time_taken, session_token } = await req.json();

    if (!player_id || !game_id || !question_id || answer === undefined || time_taken === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Verify player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, game_id, session_token")
      .eq("id", player_id)
      .eq("game_id", game_id)
      .single();

    if (playerError || !player) {
      return new Response(JSON.stringify({ error: "Invalid player or game" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (player.session_token && session_token !== player.session_token) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid session token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Duplicate check
    const { data: existing } = await supabase
      .from("player_answers")
      .select("id")
      .eq("player_id", player_id)
      .eq("game_id", game_id)
      .eq("question_id", question_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Answer already submitted" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Find question data — 3-strategy fallback
    let correct_answer: number | null = null;
    let points = 100;
    let time_limit = 15;

    // Strategy A: direct UUID lookup in questions table
    const { data: qRow } = await supabase
      .from("questions")
      .select("correct_answer, points, time_limit")
      .eq("id", question_id)
      .maybeSingle();

    if (qRow) {
      correct_answer = qRow.correct_answer;
      points = qRow.points;
      time_limit = qRow.time_limit;
    } else {
      // Strategy B: question data embedded in game settings.questions[]
      const { data: game } = await supabase
        .from("games")
        .select("settings")
        .eq("id", game_id)
        .single();

      if (game?.settings) {
        const s = typeof game.settings === "string" ? JSON.parse(game.settings) : game.settings;
        const eq = (s?.questions as any[])?.find((q: any) => q.id === question_id);
        if (eq) {
          correct_answer = eq.correctAnswer ?? eq.correct_answer ?? 0;
          points = eq.points ?? 100;
          time_limit = eq.timeLimit ?? eq.time_limit ?? 15;
        }
      }
    }

    // If still not found, store unscored but don't fail the player
    if (correct_answer === null) {
      const { data: ins } = await supabase
        .from("player_answers")
        .insert({ player_id, game_id, question_id, answer, time_taken, correct: false, points_earned: 0 })
        .select().single();
      return new Response(
        JSON.stringify({ correct: false, points_earned: 0, answer_id: ins?.id, note: "question not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Score
    const correct = answer === correct_answer;
    let points_earned = 0;
    if (correct) {
      const timeRatio = Math.max(0, 1 - time_taken / time_limit);
      points_earned = Math.round(points * (0.5 + 0.5 * timeRatio));
    }

    // 5. Insert answer
    const { data: inserted, error: insertError } = await supabase
      .from("player_answers")
      .insert({ player_id, game_id, question_id, answer, time_taken, correct, points_earned })
      .select().single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Update player score
    if (points_earned > 0) {
      const { error: rpcErr } = await supabase.rpc("increment_player_score" as any, {
        p_player_id: player_id,
        p_points: points_earned,
      });
      if (rpcErr) {
        // Fallback: manual update
        const { data: cur } = await supabase.from("players").select("score").eq("id", player_id).single();
        if (cur) {
          await supabase.from("players").update({ score: (cur.score || 0) + points_earned }).eq("id", player_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ correct, points_earned, answer_id: inserted.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("submit-answer error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

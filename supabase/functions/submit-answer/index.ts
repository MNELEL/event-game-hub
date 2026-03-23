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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the player belongs to this game
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, game_id, session_token")
      .eq("id", player_id)
      .eq("game_id", game_id)
      .single();

    if (playerError || !player) {
      return new Response(JSON.stringify({ error: "Invalid player or game" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify session token
    if (player.session_token && session_token !== player.session_token) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate answer
    const { data: existing } = await supabase
      .from("player_answers")
      .select("id")
      .eq("player_id", player_id)
      .eq("game_id", game_id)
      .eq("question_id", question_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Answer already submitted" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strategy 1: look up question in questions table by UUID
    let correct_answer: number | null = null;
    let points = 100;
    let time_limit = 15;

    const { data: questionRow } = await supabase
      .from("questions")
      .select("correct_answer, points, time_limit")
      .eq("id", question_id)
      .maybeSingle();

    if (questionRow) {
      correct_answer = questionRow.correct_answer;
      points = questionRow.points;
      time_limit = questionRow.time_limit;
    } else {
      // Strategy 2: question_id is not a DB UUID — look it up from the game's embedded settings
      // The game stores question_ids[] which may be short IDs from defaultQuestions
      // We need to find the question data from the game's settings.questions array
      const { data: game } = await supabase
        .from("games")
        .select("settings, question_ids")
        .eq("id", game_id)
        .single();

      if (game?.settings) {
        // settings may have embedded question data
        const settingsObj = typeof game.settings === "string"
          ? JSON.parse(game.settings)
          : game.settings;

        const embeddedQ = settingsObj?.questions?.find?.((q: any) => q.id === question_id);
        if (embeddedQ) {
          correct_answer = embeddedQ.correctAnswer ?? embeddedQ.correct_answer ?? 0;
          points = embeddedQ.points ?? 100;
          time_limit = embeddedQ.timeLimit ?? embeddedQ.time_limit ?? 15;
        }
      }

      // Strategy 3: scan all questions table rows and match by short id stored in question_ids
      if (correct_answer === null) {
        const { data: allQuestions } = await supabase
          .from("questions")
          .select("id, correct_answer, points, time_limit")
          .limit(500);

        const match = allQuestions?.find((q: any) => q.id === question_id);
        if (match) {
          correct_answer = match.correct_answer;
          points = match.points;
          time_limit = match.time_limit;
        }
      }
    }

    if (correct_answer === null) {
      // Cannot verify — store answer as unscored but don't fail
      const { data: inserted } = await supabase
        .from("player_answers")
        .insert({ player_id, game_id, question_id, answer, time_taken, correct: false, points_earned: 0 })
        .select().single();

      return new Response(
        JSON.stringify({ correct: false, points_earned: 0, answer_id: inserted?.id, warning: "Question not found in DB" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const correct = answer === correct_answer;
    let points_earned = 0;
    if (correct) {
      const timeRatio = Math.max(0, 1 - time_taken / time_limit);
      points_earned = Math.round(points * (0.5 + 0.5 * timeRatio));
    }

    const { data: inserted, error: insertError } = await supabase
      .from("player_answers")
      .insert({ player_id, game_id, question_id, answer, time_taken, correct, points_earned })
      .select().single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (points_earned > 0) {
      await supabase.rpc("increment_player_score" as any, {
        p_player_id: player_id,
        p_points: points_earned,
      }).then(async ({ error: rpcError }) => {
        if (rpcError) {
          const { data: cur } = await supabase.from("players").select("score").eq("id", player_id).single();
          if (cur) {
            await supabase.from("players").update({ score: cur.score + points_earned }).eq("id", player_id);
          }
        }
      });
    }

    return new Response(
      JSON.stringify({ correct, points_earned, answer_id: inserted.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in submit-answer:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

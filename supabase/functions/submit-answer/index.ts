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

    // Verify session token if player has one stored
    if (player.session_token && session_token !== player.session_token) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if answer already submitted for this question
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

    // Look up the correct answer from the questions table
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("correct_answer, points, time_limit")
      .eq("id", question_id)
      .single();

    if (qError || !question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correct = answer === question.correct_answer;
    let points_earned = 0;

    if (correct) {
      const timeRatio = Math.max(0, 1 - time_taken / question.time_limit);
      points_earned = Math.round(question.points * (0.5 + 0.5 * timeRatio));
    }

    const { data: inserted, error: insertError } = await supabase
      .from("player_answers")
      .insert({
        player_id,
        game_id,
        question_id,
        answer,
        time_taken,
        correct,
        points_earned,
      })
      .select()
      .single();

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
          const { data: currentPlayer } = await supabase
            .from("players")
            .select("score")
            .eq("id", player_id)
            .single();
          if (currentPlayer) {
            await supabase
              .from("players")
              .update({ score: currentPlayer.score + points_earned })
              .eq("id", player_id);
          }
        }
      });
    }

    return new Response(
      JSON.stringify({ correct, points_earned, answer_id: inserted.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in submit-answer function:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

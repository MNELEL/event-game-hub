// Smoke tests for the simulator's pure imports.
// (The HTTP handler itself depends on Supabase admin/auth, which is covered by
// integration testing through the host UI. Here we just guard that the imports
// resolve and `classifyJoiner` behaves as advertised.)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyJoiner } from "./logic.ts";

Deno.test("simulator: import boundary — classifyJoiner is callable", () => {
  const k = classifyJoiner(
    { status: "lobby", current_question_index: 0, start_at: null },
    null,
  );
  assertEquals(k, "absent");
});

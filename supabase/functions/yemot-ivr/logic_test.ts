import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyJoiner, decideIvrResponse, type GameState, type PhoneRow } from "./logic.ts";

const NOW = new Date("2026-01-01T12:00:00Z").getTime();

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    player_id: "p1",
    game_id: "g1",
    status: "lobby",
    current_question_index: 0,
    time_remaining: 15,
    question_ids: ["q1", "q2", "q3"],
    ...overrides,
  };
}

function lobbyRow(secondsAgo = 5, lastIdx = -1): PhoneRow {
  return {
    created_at: new Date(NOW - secondsAgo * 1000).toISOString(),
    last_question_index: lastIdx,
    joined_in_lobby: true,
  };
}

function lateRow(secondsAgo = 5): PhoneRow {
  return {
    created_at: new Date(NOW - secondsAgo * 1000).toISOString(),
    last_question_index: -1,
    joined_in_lobby: false,
  };
}

// ───── Scenario 1: caller joined BEFORE the host pressed start ─────

Deno.test("lobby joiner — first call shows welcome intro", () => {
  const d = decideIvrResponse({
    phone: "0501234567",
    params: new URLSearchParams(),
    state: baseState({ status: "lobby" }),
    phoneRow: lobbyRow(2),
    now: NOW,
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") {
    assertEquals(d.valName, "joined_intro");
    assertEquals(d.text.includes("4567"), true);
  }
});

Deno.test("lobby joiner — after intro, silently polls while in lobby", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "lobby" }),
    phoneRow: lobbyRow(20),
    now: NOW,
  });
  assertEquals(d.kind, "silent");
  if (d.kind === "silent") assertEquals(d.valName, "lobby_wait");
});

Deno.test("lobby joiner — gets the active question prompt", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({
      status: "question",
      current_question_index: 1,
      time_remaining: 10,
      current_question: { text: "שאלה לדוגמה", options: ["א", "ב", "ג", "ד"] },
    }),
    phoneRow: lobbyRow(60, -1),
    now: NOW,
  });
  assertEquals(d.kind, "answer");
  if (d.kind === "answer") {
    assertEquals(d.valName, "q1");
    assertEquals(d.text.includes("שאלה 2 מתוך 3"), true);
  }
});

// ───── Scenario 2: caller joined AFTER the game started ─────

Deno.test("late joiner — first call shows full late-explainer with progress", () => {
  const d = decideIvrResponse({
    phone: "0507654321",
    params: new URLSearchParams(),
    state: baseState({ status: "question", current_question_index: 1 }),
    phoneRow: lateRow(2),
    now: NOW,
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") {
    assertEquals(d.valName, "late_msg_0");
    assertEquals(d.text.includes("4321"), true);
    assertEquals(d.text.includes("שאלה 2 מתוך 3"), true);
    assertEquals(d.text.includes("משחק חדש"), true);
  }
});

Deno.test("late joiner — between reminders, silently polls", () => {
  const params = new URLSearchParams({ late_msg_0: "Ok" });
  const d = decideIvrResponse({
    phone: "0507654321",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lateRow(10),
    now: NOW,
  });
  assertEquals(d.kind, "silent");
  if (d.kind === "silent") assertEquals(d.valName, "late_wait_0");
});

Deno.test("late joiner — after 30s, plays the next reminder", () => {
  const params = new URLSearchParams({ late_msg_0: "Ok" });
  const d = decideIvrResponse({
    phone: "0507654321",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lateRow(35),
    now: NOW,
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") assertEquals(d.valName, "late_msg_1");
});

Deno.test("late joiner — does NOT submit answer even if digit param present", () => {
  const params = new URLSearchParams({ late_msg_0: "Ok", q0: "2" });
  const d = decideIvrResponse({
    phone: "0507654321",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lateRow(10),
    now: NOW,
  });
  assertEquals(d.kind === "submitAnswer", false);
});

Deno.test("late joiner — game finished hangs up gracefully", () => {
  const d = decideIvrResponse({
    phone: "0507654321",
    params: new URLSearchParams(),
    state: baseState({ status: "finished" }),
    phoneRow: lateRow(2),
    now: NOW,
  });
  assertEquals(d.kind, "hangup");
});

// ───── Scenario 3: answers during a live question ─────

Deno.test("answer submission — valid digit triggers submitAnswer", () => {
  const params = new URLSearchParams({ joined_intro: "Ok", q0: "3" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lobbyRow(60, -1),
    now: NOW,
  });
  assertEquals(d.kind, "submitAnswer");
  if (d.kind === "submitAnswer") {
    assertEquals(d.digit, 3);
    assertEquals(d.questionIndex, 0);
  }
});

Deno.test("answer submission — invalid digit (5+) plays question prompt again", () => {
  const params = new URLSearchParams({ joined_intro: "Ok", q0: "9" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lobbyRow(60, -1),
    now: NOW,
  });
  assertEquals(d.kind, "answer");
});

Deno.test("post-submit — accepted answer acknowledges and short waits", () => {
  const params = new URLSearchParams({ joined_intro: "Ok", q0: "2" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lobbyRow(60, -1),
    now: NOW,
    answerSubmission: { digit: 2, accepted: true },
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") {
    assertEquals(d.text.includes("נקלטה"), true);
    assertEquals(d.valName, "ack0");
  }
});

Deno.test("already answered current Q — silent poll waiting for next", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "question", current_question_index: 1, time_remaining: 8 }),
    phoneRow: lobbyRow(60, 1),
    now: NOW,
  });
  assertEquals(d.kind, "silent");
  if (d.kind === "silent") assertEquals(d.valName, "done1");
});

Deno.test("question timeout capped at POLL_SECONDS for fast resync", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "question", current_question_index: 0, time_remaining: 30 }),
    phoneRow: lobbyRow(60, -1),
    now: NOW,
  });
  assertEquals(d.kind, "answer");
  if (d.kind === "answer") assertEquals(d.seconds, 3);
});

Deno.test("results phase — silent poll between questions", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "results", current_question_index: 0 }),
    phoneRow: lobbyRow(60, 0),
    now: NOW,
  });
  assertEquals(d.kind, "silent");
  if (d.kind === "silent") assertEquals(d.valName, "between_wait");
});

Deno.test("game finished for in-lobby caller — hangup", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({ status: "finished", current_question_index: 2 }),
    phoneRow: lobbyRow(120, 2),
    now: NOW,
  });
  assertEquals(d.kind, "hangup");
});

// ───── Scenario: first-question grace recovery ─────

Deno.test("recovery intro plays once when caller joins during first question", () => {
  // Caller was admitted via the first-question grace window — joined_in_lobby=true
  // even though status='question' and current_question_index=0.
  const d = decideIvrResponse({
    phone: "0501234567",
    params: new URLSearchParams(),
    state: baseState({ status: "question", current_question_index: 0 }),
    phoneRow: lobbyRow(3, -1),
    now: NOW,
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") {
    assertEquals(d.valName, "recovered_intro");
    // Verify the message explains the situation and how to answer
    if (!d.text.includes("המשחק כבר התחיל")) {
      throw new Error("recovery intro should mention the game already started");
    }
    if (!d.text.includes("1, 2, 3 או 4")) {
      throw new Error("recovery intro should explain how to answer");
    }
  }
});

Deno.test("recovery intro is suppressed once recovered_intro var is set", () => {
  // Second poll — recovered_intro already played, should now read the question.
  const params = new URLSearchParams({ recovered_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({
      status: "question",
      current_question_index: 0,
      current_question: { text: "מה?", options: ["א", "ב", "ג", "ד"] },
    }),
    phoneRow: lobbyRow(4, -1),
    now: NOW,
  });
  assertEquals(d.kind, "answer");
  if (d.kind === "answer") {
    // First-question hint should be suppressed because recovery intro already explained it
    if (d.text.includes("זוהי השאלה הראשונה")) {
      throw new Error("first-question hint should NOT play after recovery intro");
    }
  }
});

Deno.test("late joiner message includes 'stay on line for next game' instructions", () => {
  const d = decideIvrResponse({
    phone: "0501234567",
    params: new URLSearchParams(),
    state: baseState({ status: "question", current_question_index: 2 }),
    phoneRow: lateRow(2),
    now: NOW,
  });
  assertEquals(d.kind, "wait");
  if (d.kind === "wait") {
    if (!d.text.includes("הישאר על הקו")) {
      throw new Error("late joiner message should tell them to stay on the line");
    }
    if (!d.text.includes("ברוכים הבאים")) {
      throw new Error("late joiner message should mention the welcome cue");
    }
    if (!d.text.includes("1, 2, 3 או 4")) {
      throw new Error("late joiner message should explain how to answer in the next game");
    }
    // Terminology consistency: always say "משחק חדש", never "המשחק הבא".
    if (d.text.includes("המשחק הבא")) {
      throw new Error("late joiner message must use 'משחק חדש', not 'המשחק הבא'");
    }
  }
});

Deno.test("first-question hint plays for normal lobby joiner (no recovery intro)", () => {
  const params = new URLSearchParams({ joined_intro: "Ok" });
  const d = decideIvrResponse({
    phone: "0501234567",
    params,
    state: baseState({
      status: "question",
      current_question_index: 0,
      current_question: { text: "מה?", options: ["א", "ב", "ג", "ד"] },
    }),
    phoneRow: lobbyRow(20, -1),
    now: NOW,
  });
  assertEquals(d.kind, "answer");
  if (d.kind === "answer") {
    if (!d.text.includes("זוהי השאלה הראשונה")) {
      throw new Error("first-question hint should play for normal joiners");
    }
  }
});

// Integration tests for the join_phone_player RPC.
// Verifies the grace-window rule: joined_in_lobby is true ONLY when
//   status = 'lobby' AND (start_at IS NULL OR now() < start_at).
//
// Run with: supabase test edge-functions yemot-ivr
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function makeClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
}

// Generate a phone number in a high reserved range so we never collide
// with real callers. 10 digits, prefixed 999.
function fakePhone(seed: number): string {
  const tail = String(seed).padStart(7, "0");
  return `999${tail}`;
}

type GameOpts = {
  status: "lobby" | "playing" | "question" | "finished";
  startAt: Date | null;
};

async function createGame(
  admin: SupabaseClient,
  opts: GameOpts,
): Promise<string> {
  // Use a code that sorts to the top of "most recent" via updated_at.
  const code = "TST" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const { data, error } = await admin
    .from("games")
    .insert({
      code,
      status: opts.status,
      start_at: opts.startAt ? opts.startAt.toISOString() : null,
      question_ids: [],
      current_question_index: 0,
      time_remaining: 15,
      settings: {},
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createGame failed: ${error?.message}`);
  // Bump updated_at so this game wins the "most recent active" lookup
  // inside join_phone_player.
  await admin.from("games").update({ updated_at: new Date().toISOString() }).eq("id", data.id);
  return data.id as string;
}

async function cleanupGame(admin: SupabaseClient, gameId: string, phones: string[]) {
  await admin.from("phone_players").delete().in("phone", phones);
  await admin.from("players").delete().eq("game_id", gameId);
  await admin.from("games").delete().eq("id", gameId);
}

async function callJoin(admin: SupabaseClient, phone: string) {
  const { data, error } = await admin.rpc("join_phone_player", { p_phone: phone });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

async function readPhoneRow(admin: SupabaseClient, phone: string) {
  const { data } = await admin
    .from("phone_players")
    .select("joined_in_lobby,game_id")
    .eq("phone", phone)
    .maybeSingle();
  return data as { joined_in_lobby: boolean; game_id: string } | null;
}

const SKIP_REASON =
  "skipping integration test: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set";

Deno.test("join_phone_player: lobby + start_at NULL → joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(1);
  const gameId = await createGame(admin, { status: "lobby", startAt: null });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.game_id, gameId);
    assertEquals(row?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("join_phone_player: lobby + start_at in future → joined_in_lobby = true (inside grace)", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(2);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 30_000),
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("join_phone_player: lobby + start_at in past → joined_in_lobby = false (grace expired)", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(3);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() - 5_000),
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("join_phone_player: status=question → joined_in_lobby = false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(4);
  const gameId = await createGame(admin, {
    status: "question",
    startAt: new Date(Date.now() + 30_000), // even if start_at future, status disqualifies
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("join_phone_player: status=playing + start_at NULL → joined_in_lobby = false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(5);
  const gameId = await createGame(admin, { status: "playing", startAt: null });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("join_phone_player: invalid phone (< 4 digits) → throws invalid_phone", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const { error } = await admin.rpc("join_phone_player", { p_phone: "12" });
  assertEquals(error?.message?.includes("invalid_phone"), true);
});

Deno.test("join_phone_player: re-call for same phone in same game keeps existing record", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(6);
  const gameId = await createGame(admin, { status: "lobby", startAt: null });
  try {
    await callJoin(admin, phone);
    const first = await readPhoneRow(admin, phone);
    // Flip the game past the grace window
    await admin.from("games").update({
      start_at: new Date(Date.now() - 1_000).toISOString(),
    }).eq("id", gameId);
    // Bump updated_at so this game still wins lookup
    await admin.from("games").update({ updated_at: new Date().toISOString() }).eq("id", gameId);
    await callJoin(admin, phone);
    const second = await readPhoneRow(admin, phone);
    // Existing record must NOT be downgraded — caller already qualified.
    assertEquals(second?.joined_in_lobby, first?.joined_in_lobby);
    assertEquals(second?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge-case tests — boundaries around status transitions and the grace window.
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("edge: caller arriving 50ms BEFORE start_at → joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(10);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 200), // tight window
  });
  try {
    // Race the boundary on purpose — call should land just before start_at.
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("edge: caller arriving 50ms AFTER start_at → joined_in_lobby = false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(11);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() - 50),
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("edge: caller arrives BEFORE host clicks start (start_at NULL) then status flips → row stays joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(12);
  const gameId = await createGame(admin, { status: "lobby", startAt: null });
  try {
    await callJoin(admin, phone);
    const before = await readPhoneRow(admin, phone);
    assertEquals(before?.joined_in_lobby, true);
    // Host clicks start → status flips to question
    await admin.from("games").update({
      status: "question",
      start_at: new Date(Date.now() - 1_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", gameId);
    // Caller polls again — must NOT be downgraded
    await callJoin(admin, phone);
    const after = await readPhoneRow(admin, phone);
    assertEquals(after?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("edge: caller arrives JUST AFTER status flips lobby→question (start_at past) → joined_in_lobby = false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(13);
  // Simulate the moment just after the host transition.
  const gameId = await createGame(admin, {
    status: "question",
    startAt: new Date(Date.now() - 100),
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("edge: caller arrives at the exact moment grace window opens (start_at far future) → joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(14);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 60_000),
  });
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("edge: two callers — one before, one after start_at (sequential)", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const earlyPhone = fakePhone(15);
  const latePhone = fakePhone(16);
  // Window opens for ~250ms then expires
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 250),
  });
  try {
    await callJoin(admin, earlyPhone); // inside window
    // Wait until past start_at
    await new Promise(r => setTimeout(r, 400));
    await callJoin(admin, latePhone);  // outside window
    const early = await readPhoneRow(admin, earlyPhone);
    const late = await readPhoneRow(admin, latePhone);
    assertEquals(early?.joined_in_lobby, true);
    assertEquals(late?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [earlyPhone, latePhone]);
  }
});

Deno.test("edge: host cancels grace (start_at advanced to now) — caller arriving after gets joined_in_lobby = false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(17);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 30_000),
  });
  try {
    // Host clicks "skip and start now" — pull start_at to the past, status will flip momentarily
    await admin.from("games").update({
      start_at: new Date(Date.now() - 1).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", gameId);
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

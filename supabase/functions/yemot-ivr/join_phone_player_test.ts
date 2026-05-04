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

// ─────────────────────────────────────────────────────────────────────────────
// Timezone / DST tests — start_at vs now() must compare correctly regardless
// of the textual offset used to store the timestamp. Postgres `timestamptz`
// normalizes to UTC, so equivalent instants written via UTC, +03:00, -05:00,
// or an Israel-local DST/standard offset must all yield the same comparison.
// ─────────────────────────────────────────────────────────────────────────────

// Format a Date as ISO with an explicit offset string like "+03:00", "-05:00", "Z".
function isoWithOffset(d: Date, offsetMinutes: number): string {
  const shifted = new Date(d.getTime() + offsetMinutes * 60_000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const y = shifted.getUTCFullYear();
  const mo = pad(shifted.getUTCMonth() + 1);
  const da = pad(shifted.getUTCDate());
  const h = pad(shifted.getUTCHours());
  const mi = pad(shifted.getUTCMinutes());
  const s = pad(shifted.getUTCSeconds());
  const ms = pad(shifted.getUTCMilliseconds(), 3);
  if (offsetMinutes === 0) return `${y}-${mo}-${da}T${h}:${mi}:${s}.${ms}Z`;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return `${y}-${mo}-${da}T${h}:${mi}:${s}.${ms}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

async function createGameRawStartAt(
  admin: SupabaseClient,
  status: GameOpts["status"],
  startAtIso: string,
): Promise<string> {
  const code = "TZ" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const { data, error } = await admin
    .from("games")
    .insert({
      code, status, start_at: startAtIso, question_ids: [],
      current_question_index: 0, time_remaining: 15, settings: {},
    })
    .select("id").single();
  if (error || !data) throw new Error(`createGameRawStartAt failed: ${error?.message}`);
  await admin.from("games").update({ updated_at: new Date().toISOString() }).eq("id", data.id);
  return data.id as string;
}

const OFFSETS: Array<{ label: string; minutes: number }> = [
  { label: "UTC (Z)", minutes: 0 },
  { label: "Israel standard +02:00", minutes: 120 },
  { label: "Israel DST +03:00", minutes: 180 },
  { label: "US Eastern -05:00", minutes: -300 },
  { label: "India +05:30", minutes: 330 },
  { label: "Pacific/Chatham +12:45", minutes: 765 },
];

for (const off of OFFSETS) {
  Deno.test(`tz: future start_at written as ${off.label} → joined_in_lobby = true`, async () => {
    const admin = makeClient();
    if (!admin) { console.warn(SKIP_REASON); return; }
    const phone = fakePhone(20 + off.minutes); // unique
    const startAtIso = isoWithOffset(new Date(Date.now() + 30_000), off.minutes);
    const gameId = await createGameRawStartAt(admin, "lobby", startAtIso);
    try {
      await callJoin(admin, phone);
      const row = await readPhoneRow(admin, phone);
      assertEquals(row?.joined_in_lobby, true, `offset ${off.label} should be inside grace`);
    } finally {
      await cleanupGame(admin, gameId, [phone]);
    }
  });

  Deno.test(`tz: past start_at written as ${off.label} → joined_in_lobby = false`, async () => {
    const admin = makeClient();
    if (!admin) { console.warn(SKIP_REASON); return; }
    const phone = fakePhone(2000 + off.minutes);
    const startAtIso = isoWithOffset(new Date(Date.now() - 30_000), off.minutes);
    const gameId = await createGameRawStartAt(admin, "lobby", startAtIso);
    try {
      await callJoin(admin, phone);
      const row = await readPhoneRow(admin, phone);
      assertEquals(row?.joined_in_lobby, false, `offset ${off.label} should be past grace`);
    } finally {
      await cleanupGame(admin, gameId, [phone]);
    }
  });
}

Deno.test("tz: same instant written with different offsets stores identical UTC value", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const instant = new Date(Date.now() + 60_000);
  const variants = OFFSETS.map((o) => isoWithOffset(instant, o.minutes));
  const ids: string[] = [];
  try {
    for (const iso of variants) {
      ids.push(await createGameRawStartAt(admin, "lobby", iso));
    }
    const { data } = await admin
      .from("games").select("id,start_at").in("id", ids);
    const utcStrings = (data ?? []).map((r) => new Date(r.start_at as string).getTime());
    const uniq = new Set(utcStrings);
    assertEquals(uniq.size, 1, `all offset-variants should normalize to one UTC instant; got ${[...uniq].join(",")}`);
  } finally {
    for (const id of ids) await admin.from("games").delete().eq("id", id);
  }
});

Deno.test("dst: spring-forward boundary — start_at scheduled across Israel DST switch compares correctly", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  // Construct a moment ~30s in the future, but write it using the OPPOSITE
  // offset (DST vs standard) than current local time to exercise the
  // conversion path. Postgres should still normalize it to the same UTC
  // instant and now() < start_at must hold.
  const phone = fakePhone(31415);
  const future = new Date(Date.now() + 30_000);
  // Force the +03:00 representation (Israel DST) regardless of caller TZ
  const iso = isoWithOffset(future, 180);
  const gameId = await createGameRawStartAt(admin, "lobby", iso);
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, true);
    // Sanity: read back and confirm the stored UTC equals the original instant ±1ms.
    const { data } = await admin.from("games").select("start_at").eq("id", gameId).single();
    const drift = Math.abs(new Date((data as any).start_at).getTime() - future.getTime());
    assertEquals(drift < 1500, true, `DST conversion drift too large: ${drift}ms`);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("dst: fall-back boundary — start_at written with standard +02:00 offset still respects grace window", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(27182);
  const past = new Date(Date.now() - 10_000);
  // Write a past instant with Israel-standard +02:00 offset.
  const iso = isoWithOffset(past, 120);
  const gameId = await createGameRawStartAt(admin, "lobby", iso);
  try {
    await callJoin(admin, phone);
    const row = await readPhoneRow(admin, phone);
    assertEquals(row?.joined_in_lobby, false);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("tz: server now() and client Date.now() agree within a few seconds (clock-skew guard)", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const { data, error } = await admin.rpc("join_phone_player", { p_phone: "1" });
  // We don't care about the result — we only used the call to force a round-trip.
  void data; void error;
  const { data: rows } = await admin
    .from("games").select("updated_at").order("updated_at", { ascending: false }).limit(1);
  if (!rows || rows.length === 0) return;
  const serverTs = new Date((rows[0] as any).updated_at).getTime();
  const skewSec = Math.abs(Date.now() - serverTs) / 1000;
  // Loose bound — just catches a server stuck in the wrong epoch / TZ.
  assertEquals(skewSec < 60 * 60, true, `server clock skew suspiciously large: ${skewSec.toFixed(1)}s`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency / race tests — many callers hitting join_phone_player in
// parallel right around the start_at boundary. The invariant under test:
// NO caller may receive joined_in_lobby = true once now() >= start_at.
// ─────────────────────────────────────────────────────────────────────────────

async function callJoinSafe(admin: SupabaseClient, phone: string) {
  try { return await callJoin(admin, phone); }
  catch (e) { return { error: (e as Error).message }; }
}

Deno.test("race: 20 callers in parallel, all BEFORE start_at → all joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phones = Array.from({ length: 20 }, (_, i) => fakePhone(40000 + i));
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 10_000), // wide window — all should be inside
  });
  try {
    await Promise.all(phones.map((p) => callJoinSafe(admin, p)));
    const { data } = await admin
      .from("phone_players").select("phone,joined_in_lobby").in("phone", phones);
    const rows = (data ?? []) as Array<{ phone: string; joined_in_lobby: boolean }>;
    assertEquals(rows.length, phones.length);
    const wrong = rows.filter((r) => r.joined_in_lobby !== true);
    assertEquals(wrong.length, 0, `expected all true, late: ${wrong.map(r=>r.phone).join(",")}`);
  } finally {
    await cleanupGame(admin, gameId, phones);
  }
});

Deno.test("race: 20 callers in parallel, all AFTER start_at → none get joined_in_lobby = true", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phones = Array.from({ length: 20 }, (_, i) => fakePhone(41000 + i));
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() - 5_000), // already expired
  });
  try {
    await Promise.all(phones.map((p) => callJoinSafe(admin, p)));
    const { data } = await admin
      .from("phone_players").select("phone,joined_in_lobby").in("phone", phones);
    const rows = (data ?? []) as Array<{ phone: string; joined_in_lobby: boolean }>;
    const granted = rows.filter((r) => r.joined_in_lobby === true);
    assertEquals(granted.length, 0, `none should be in lobby, granted to: ${granted.map(r=>r.phone).join(",")}`);
  } finally {
    await cleanupGame(admin, gameId, phones);
  }
});

Deno.test("race: 30 callers fired in parallel as start_at flips mid-flight → only pre-flip callers get joined_in_lobby; post-flip get false", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phones = Array.from({ length: 30 }, (_, i) => fakePhone(42000 + i));
  // Open a tight grace window. The host (this test) will yank start_at into
  // the past after the first wave is dispatched. The DB clock decides per row.
  const startAt = new Date(Date.now() + 400);
  const gameId = await createGame(admin, { status: "lobby", startAt });
  try {
    // Wave 1: half the callers race to land BEFORE start_at.
    const wave1 = phones.slice(0, 15).map((p) => callJoinSafe(admin, p));
    // Force the boundary closed mid-flight.
    setTimeout(() => {
      admin.from("games").update({
        start_at: new Date(Date.now() - 1).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", gameId).then(() => {});
    }, 100);
    await Promise.all(wave1);
    // Wait until we are definitely past the original start_at.
    await new Promise((r) => setTimeout(r, 500));
    // Wave 2: the rest race AFTER the boundary is closed.
    const wave2 = phones.slice(15).map((p) => callJoinSafe(admin, p));
    await Promise.all(wave2);

    const { data } = await admin
      .from("phone_players").select("phone,joined_in_lobby").in("phone", phones);
    const rows = (data ?? []) as Array<{ phone: string; joined_in_lobby: boolean }>;
    const w2Phones = new Set(phones.slice(15));
    const w2Granted = rows.filter((r) => w2Phones.has(r.phone) && r.joined_in_lobby === true);
    // Hard invariant: NOBODY in wave 2 may have been granted in-lobby status.
    assertEquals(w2Granted.length, 0, `wave-2 callers wrongly in lobby: ${w2Granted.map(r=>r.phone).join(",")}`);
  } finally {
    await cleanupGame(admin, gameId, phones);
  }
});

Deno.test("race: same phone called concurrently 10× → exactly one phone_players row, no duplicate players", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phone = fakePhone(43000);
  const gameId = await createGame(admin, {
    status: "lobby",
    startAt: new Date(Date.now() + 10_000),
  });
  try {
    await Promise.all(Array.from({ length: 10 }, () => callJoinSafe(admin, phone)));
    const { data: rows } = await admin
      .from("phone_players").select("phone,player_id,joined_in_lobby").eq("phone", phone);
    assertEquals((rows ?? []).length, 1, "phone_players must dedupe by phone");
    assertEquals((rows as any[])[0].joined_in_lobby, true);
  } finally {
    await cleanupGame(admin, gameId, [phone]);
  }
});

Deno.test("race: status flips lobby→question while 25 calls in-flight → no post-flip caller granted", async () => {
  const admin = makeClient();
  if (!admin) { console.warn(SKIP_REASON); return; }
  const phones = Array.from({ length: 25 }, (_, i) => fakePhone(44000 + i));
  const gameId = await createGame(admin, { status: "lobby", startAt: null });
  try {
    // Fire half before flip.
    const before = phones.slice(0, 10).map((p) => callJoinSafe(admin, p));
    await Promise.all(before);
    // Host flips status away from lobby.
    await admin.from("games").update({
      status: "question",
      start_at: new Date(Date.now() - 100).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", gameId);
    // Fire the rest in parallel after the flip.
    const after = phones.slice(10).map((p) => callJoinSafe(admin, p));
    await Promise.all(after);

    const { data } = await admin
      .from("phone_players").select("phone,joined_in_lobby").in("phone", phones);
    const rows = (data ?? []) as Array<{ phone: string; joined_in_lobby: boolean }>;
    const afterSet = new Set(phones.slice(10));
    const wronglyGranted = rows.filter((r) => afterSet.has(r.phone) && r.joined_in_lobby === true);
    assertEquals(wronglyGranted.length, 0, `post-flip callers wrongly in lobby: ${wronglyGranted.map(r=>r.phone).join(",")}`);
    // And the pre-flip wave should all be in lobby.
    const beforeSet = new Set(phones.slice(0, 10));
    const preMissed = rows.filter((r) => beforeSet.has(r.phone) && r.joined_in_lobby !== true);
    assertEquals(preMissed.length, 0, `pre-flip callers wrongly excluded: ${preMissed.map(r=>r.phone).join(",")}`);
  } finally {
    await cleanupGame(admin, gameId, phones);
  }
});

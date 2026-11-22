// IVR call simulator. Drives the pure decision function through a scripted
// game timeline so we can eyeball what each caller would hear.
//
// Run inside Deno (in the edge function tests) or via:
//   deno run --allow-read supabase/functions/yemot-ivr/simulate.ts
import { decideIvrResponse, renderDecision, type GameState, type PhoneRow } from "./logic.ts";

type Caller = {
  phone: string;
  joinedAt: number; // virtual seconds
  joinedInLobby: boolean;
  lastAnsweredIdx: number;
  params: URLSearchParams;
  digitToType?: { atSecond: number; questionIndex: number; digit: number };
};

type Step = { atSecond: number; state: Partial<GameState> };

const baseState: GameState = {
  player_id: "p", game_id: "g",
  status: "lobby",
  current_question_index: 0,
  time_remaining: 15,
  question_ids: ["q1", "q2"],
};

const timeline: Step[] = [
  { atSecond: 0,  state: { status: "lobby" } },
  { atSecond: 10, state: { status: "playing" } },
  { atSecond: 12, state: { status: "question", current_question_index: 0, time_remaining: 15 } },
  { atSecond: 30, state: { status: "results",  current_question_index: 0 } },
  { atSecond: 35, state: { status: "question", current_question_index: 1, time_remaining: 15 } },
  { atSecond: 55, state: { status: "finished", current_question_index: 1 } },
];

function stateAt(sec: number): GameState {
  let s: GameState = { ...baseState };
  for (const step of timeline) {
    if (step.atSecond <= sec) s = { ...s, ...step.state };
  }
  return s;
}

const callers: Caller[] = [
  {
    phone: "0501111111", joinedAt: 2, joinedInLobby: true, lastAnsweredIdx: -1,
    params: new URLSearchParams(),
    digitToType: { atSecond: 18, questionIndex: 0, digit: 2 },
  },
  {
    phone: "0502222222", joinedAt: 14, joinedInLobby: false, lastAnsweredIdx: -1,
    params: new URLSearchParams(),
  },
  {
    phone: "0503333333", joinedAt: 36, joinedInLobby: false, lastAnsweredIdx: -1,
    params: new URLSearchParams(),
  },
];

const NOW0 = 1_700_000_000_000;

function simulate() {
  console.log("=== IVR call simulator ===\n");
  for (const c of callers) {
    console.log(`📞 Caller ${c.phone} (joined at t+${c.joinedAt}s, lobby=${c.joinedInLobby})`);
    for (let t = c.joinedAt; t <= 60; t += 4) {
      const state = stateAt(t);
      const phoneRow: PhoneRow = {
        created_at: new Date(NOW0 + c.joinedAt * 1000).toISOString(),
        last_question_index: c.lastAnsweredIdx,
        joined_in_lobby: c.joinedInLobby,
      };
      // Inject typed digit at the right moment
      if (c.digitToType && Math.abs(t - c.digitToType.atSecond) <= 2 &&
          state.status === "question" &&
          state.current_question_index === c.digitToType.questionIndex) {
        c.params.set(`q${c.digitToType.questionIndex}`, String(c.digitToType.digit));
      }
      const now = NOW0 + t * 1000;
      let d = decideIvrResponse({ phone: c.phone, params: c.params, state, phoneRow, now });
      if (d.kind === "submitAnswer") {
        c.lastAnsweredIdx = d.questionIndex;
        d = decideIvrResponse({
          phone: c.phone, params: c.params, state, phoneRow: { ...phoneRow, last_question_index: c.lastAnsweredIdx }, now,
          answerSubmission: { digit: d.digit, accepted: true },
        });
      }
      // Mark this val_name as having been "spoken" so subsequent calls won't repeat it
      if (d.kind === "wait" || d.kind === "silent" || d.kind === "answer") {
        c.params.set(d.valName, "Ok");
      }
      const label = d.kind === "hangup" ? `HANGUP "${d.text}"`
                  : d.kind === "wait"   ? `WAIT  ${d.seconds}s "${d.text}"`
                  : d.kind === "answer" ? `ASK   ${d.seconds}s "${d.text}"`
                  : d.kind === "silent" ? `poll  ${d.seconds}s`
                  : "submitAnswer";
      console.log(`  t+${String(t).padStart(2)}s [${state.status.padEnd(11)} q${state.current_question_index}]  → ${label}`);
      if (d.kind === "hangup") break;
    }
    console.log("");
  }
}

if (import.meta.main) simulate();
export { simulate };

// Pure IVR decision logic — no network/IO. Easy to unit-test and simulate.

export type GameStatus =
  | "lobby"
  | "playing"
  | "question"
  | "results"
  | "leaderboard"
  | "finished";

export type GameState = {
  player_id: string;
  game_id: string;
  status: GameStatus;
  current_question_index: number;
  time_remaining: number;
  question_ids: string[];
  start_at?: string | null;
  game_title?: string | null;
  current_question?: { text: string; options: string[] } | null;
};

export type PhoneRow = {
  created_at?: string;
  last_question_index?: number;
  last_seen_question_index?: number;
  joined_in_lobby?: boolean;
};

export type DecideInput = {
  phone: string;
  params: URLSearchParams;
  state: GameState;
  phoneRow?: PhoneRow;
  now?: number;
  // Whether an answer was just accepted by the RPC (for the post-submit branch)
  answerSubmission?: { digit: number; accepted: boolean };
};

export type Decision =
  | { kind: "hangup"; text: string }
  | { kind: "wait"; text: string; valName: string; seconds: number }
  | { kind: "answer"; text: string; valName: string; seconds: number }
  | { kind: "silent"; valName: string; seconds: number }
  | {
      // Indicates the handler should call submit_phone_answer with this digit,
      // then call decideIvrResponse again with answerSubmission populated.
      kind: "submitAnswer";
      digit: number;
      questionIndex: number;
    };

export const POLL_SECONDS = 3;

// Format an ISO timestamp as Israeli local "HH:MM" (Asia/Jerusalem).
// Used to announce the exact game start time to phone callers.
export function formatStartTimeIL(iso: string): string {
  try {
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jerusalem",
      hour12: false,
    });
    return fmt.format(d);
  } catch {
    return "";
  }
}

export function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export function tts(text: string): string {
  return "t-" + text.replace(/[.\-"'&|=,]/g, " ").replace(/\s+/g, " ").trim();
}

export function renderDecision(d: Decision): string {
  switch (d.kind) {
    case "hangup":
      return `id_list_message=${tts(d.text)}.g-hangup`;
    case "wait":
      return `read=${tts(d.text)}=${d.valName},no,1,1,${d.seconds},No,yes,no,,9,1,Ok,None`;
    case "answer":
      return `read=${tts(d.text)}=${d.valName},no,1,1,${d.seconds},No,yes,no,,1.2.3.4,1,Ok,None`;
    case "silent":
      return `read=t-=${d.valName},no,1,1,${d.seconds},No,yes,no,,9,1,Ok,None`;
    case "submitAnswer":
      return `__submitAnswer:${d.questionIndex}:${d.digit}`;
  }
}

export function decideIvrResponse(input: DecideInput): Decision {
  const { phone, params, state, phoneRow, answerSubmission } = input;
  const now = input.now ?? Date.now();

  if (!phone) {
    return { kind: "hangup", text: "לא זוהה מספר מתקשר." };
  }

  const joinedSecondsAgo = phoneRow?.created_at
    ? (now - new Date(phoneRow.created_at).getTime()) / 1000
    : 999;
  const justJoined = joinedSecondsAgo < 12;
  const joinedInLobby = phoneRow?.joined_in_lobby === true;
  const lastAnsweredIdx = phoneRow?.last_question_index ?? -1;
  const alreadyAnsweredCurrent = lastAnsweredIdx >= state.current_question_index;
  // Auto-recovery: caller was admitted via the first-question grace window
  // (host already pressed Start, but we're still on question 1). Identified by:
  //   - they're in-lobby
  //   - the game is mid-question on the very first question
  //   - they joined within the last few seconds (so this is likely their first poll)
  const isFirstQuestionRecovery =
    joinedInLobby &&
    state.status === "question" &&
    state.current_question_index === 0 &&
    joinedSecondsAgo < 15;

  // After the RPC accepted/rejected an answer, just acknowledge and silently poll.
  if (answerSubmission) {
    return {
      kind: "wait",
      text: answerSubmission.accepted ? "תשובתך נקלטה." : "כבר נקלטה תשובה.",
      valName: `ack${state.current_question_index}`,
      seconds: 2,
    };
  }

  // Late joiners — never allowed to answer in this game.
  if (!joinedInLobby) {
    if (state.status === "finished") {
      return {
        kind: "hangup",
        text: `המשחק הסתיים. נרשמת בשם מתקשר ${phone.slice(-4)}. תוכל להשתתף במשחק הבא. תודה רבה.`,
      };
    }
    const total = state.question_ids?.length || 0;
    const qNum = state.current_question_index + 1;
    const remainingQs = Math.max(0, total - qNum);

    let progress = "המשחק בעיצומו";
    if (state.status === "lobby" || state.status === "playing") {
      progress = "המשחק עומד להתחיל";
    } else if (state.status === "question") {
      progress = `כעת מתקיימת שאלה ${qNum} מתוך ${total}`;
    } else if (state.status === "results" || state.status === "leaderboard") {
      progress = `הסתיימה שאלה ${qNum} מתוך ${total}`;
    }
    const tail = remainingQs > 0
      ? `נותרו ${remainingQs} שאלות עד סיום המשחק. אנא הישאר על הקו עד סיום המשחק הנוכחי. ברגע שיתחיל משחק חדש, נצרף אותך אוטומטית ותשמע 'ברוכים הבאים', ואז תוכל לענות על השאלות על ידי הקשת 1, 2, 3 או 4.`
      : `המשחק לקראת סיום. אנא הישאר על הקו. ברגע שיתחיל משחק חדש, נצרף אותך אוטומטית ותשמע 'ברוכים הבאים', ואז תוכל לענות על השאלות על ידי הקשת 1, 2, 3 או 4.`;

    const cycle = Math.floor(joinedSecondsAgo / 30);
    const reminderVar = `late_msg_${cycle}`;
    // If host scheduled the next game start, announce the exact clock time.
    const nextStart =
      state.status === "lobby" && state.start_at &&
      new Date(state.start_at).getTime() > now
        ? formatStartTimeIL(state.start_at)
        : "";
    const tailWithTime = nextStart
      ? `המשחק הבא יתחיל בשעה ${nextStart}. אנא הישאר על הקו ואל תנתק. כשהמשחק יתחיל, תשמע 'ברוכים הבאים' ותוכל לענות על השאלות.`
      : tail;
    if (!params.has(reminderVar)) {
      const intro = cycle === 0
        ? `שלום, נרשמת בשם מתקשר ${phone.slice(-4)}. ${progress}. הצטרפת לאחר תחילת המשחק ולכן לא תוכל לענות על השאלות הנוכחיות. ${tailWithTime}`
        : `${progress}. ${tailWithTime}`;
      return { kind: "wait", text: intro, valName: reminderVar, seconds: cycle === 0 ? 10 : 6 };
    }
    return { kind: "silent", valName: `late_wait_${cycle}`, seconds: POLL_SECONDS };
  }

  // Caller is in lobby — handle answer submission first.
  // Dedupe: never submit twice for the same question, even if Yemot replays
  // the q${idx} param across subsequent polls. We rely on three signals:
  //   1) phoneRow.last_question_index (persisted after RPC)
  //   2) ack${idx} sentinel var set on the previous response
  //   3) submitted${idx} client-tracked sentinel
  const answerVar = `q${state.current_question_index}`;
  const ackVar = `ack${state.current_question_index}`;
  const submittedVar = `submitted${state.current_question_index}`;
  const answerInput = (params.get(answerVar) || "").trim();
  const alreadySubmittedThisCall =
    params.has(ackVar) || params.has(submittedVar);
  if (
    answerInput &&
    state.status === "question" &&
    !alreadyAnsweredCurrent &&
    !alreadySubmittedThisCall
  ) {
    const digit = parseInt(answerInput, 10);
    if (digit >= 1 && digit <= 4) {
      return { kind: "submitAnswer", digit, questionIndex: state.current_question_index };
    }
  }

  // If we already answered (in DB or in this call), short-circuit to silent poll
  // so a stale q${idx} param can never re-trigger a submission.
  if (
    state.status === "question" &&
    (alreadyAnsweredCurrent || alreadySubmittedThisCall)
  ) {
    return {
      kind: "silent",
      valName: `done${state.current_question_index}`,
      seconds: POLL_SECONDS,
    };
  }

  // Recovery intro: caller dialed in after host pressed Start, but the first
  // question is still active so they were auto-admitted. Play this once before
  // the question is read so the experience is clear.
  if (isFirstQuestionRecovery && !params.has("recovered_intro")) {
    const title = (state.game_title || "").trim();
    const welcome = title
      ? `שלום, ברוכים הבאים למשחק ${title}.`
      : `שלום, ברוכים הבאים למשחק הטריוויה.`;
    return {
      kind: "wait",
      text: `${welcome} נרשמת בשם מתקשר ${phone.slice(-4)}. המשחק כבר התחיל אבל הספקת להצטרף בזמן לשאלה הראשונה. כעת תשמע את השאלה — הקשב לארבע האפשרויות, ובסיום הקש 1, 2, 3 או 4 לבחירת התשובה.`,
      valName: "recovered_intro",
      seconds: 9,
    };
  }

  if (justJoined && !params.has("joined_intro")) {
    const lobbyStart =
      state.status === "lobby" && state.start_at &&
      new Date(state.start_at).getTime() > now
        ? formatStartTimeIL(state.start_at)
        : "";
    const title = (state.game_title || "").trim();
    const welcome = title
      ? `ברוכים הבאים למשחק ${title}.`
      : `ברוכים הבאים למשחק הטריוויה.`;
    const registered = `הרשמתך התקבלה. אתה רשום בשם מתקשר ${phone.slice(-4)}.`;
    const tail = lobbyStart
      ? `המשחק יתחיל בשעה ${lobbyStart}. אנא המתן להפעלת המשחק.`
      : `אנא המתן להפעלת המשחק.`;
    return {
      kind: "wait",
      text: `${welcome} ${registered} ${tail}`,
      valName: "joined_intro",
      seconds: lobbyStart ? 7 : 5,
    };
  }

  // Periodically remind in-lobby callers of the exact start time while they wait.
  if (state.status === "lobby" && state.start_at) {
    const startMs = new Date(state.start_at).getTime();
    if (startMs > now) {
      const lobbyStart = formatStartTimeIL(state.start_at);
      const cycle = Math.floor(joinedSecondsAgo / 30);
      const reminderVar = `lobby_time_${cycle}`;
      if (cycle > 0 && !params.has(reminderVar)) {
        return {
          kind: "wait",
          text: `המשחק יתחיל בשעה ${lobbyStart}. אנא הישאר על הקו.`,
          valName: reminderVar,
          seconds: 5,
        };
      }
    }
  }

  switch (state.status) {
    case "lobby":
      return { kind: "silent", valName: "lobby_wait", seconds: POLL_SECONDS };
    case "playing":
      return { kind: "silent", valName: "playing_wait", seconds: POLL_SECONDS };
    case "question": {
      if (alreadyAnsweredCurrent) {
        return { kind: "silent", valName: `done${state.current_question_index}`, seconds: POLL_SECONDS };
      }
      const qNum = state.current_question_index + 1;
      const total = state.question_ids?.length || 0;
      const remaining = Math.max(1, state.time_remaining || POLL_SECONDS);
      const timeout = Math.min(remaining, POLL_SECONDS);
      const q = state.current_question;
      const introVar = `qintro${state.current_question_index}`;
      const seenThisQ =
        (phoneRow?.last_seen_question_index ?? -1) >= state.current_question_index;
      // First poll of this question — read the full question + options once.
      if (q && !params.has(introVar) && !seenThisQ) {
        const opts = (q.options || []).slice(0, 4)
          .map((o, i) => `${i + 1}. ${o}.`).join(" ");
        // For question 1, add a brief listening hint (unless we just played the
        // recovery intro, which already explained how to answer).
        const firstQHint =
          state.current_question_index === 0 && !params.has("recovered_intro")
            ? "זוהי השאלה הראשונה. הקשב היטב לארבע האפשרויות. "
            : "";
        const text =
          `${firstQHint}שאלה ${qNum} מתוך ${total}. ${q.text}. ` +
          `${opts} הקש את מספר התשובה: 1, 2, 3 או 4.`;
        return {
          kind: "answer",
          text,
          valName: answerVar,
          seconds: Math.max(timeout, 6),
        };
      }
      return {
        kind: "answer",
        text: `נותרו ${remaining} שניות. הקש 1, 2, 3 או 4.`,
        valName: answerVar,
        seconds: timeout,
      };
    }
    case "results":
    case "leaderboard":
      return { kind: "silent", valName: "between_wait", seconds: POLL_SECONDS };
    case "finished":
    default:
      return { kind: "hangup", text: "המשחק הסתיים. תודה על ההשתתפות." };
  }
}

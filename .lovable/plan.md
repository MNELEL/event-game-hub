## Goal

When a player loses connection, keep the player visually on the **same screen with the same data** they last saw — no flashes back to the lobby, no timer resetting, no blank "המשחק מתחיל בקרוב..." fallback. State should only "catch up" once a real, fresh server update arrives after reconnection.

## Current behavior (problem)

- `usePlayerGame` keeps state in React, but several flows can cause visible jumps during a disconnection:
  1. The local 1-second timer in `PlayerJoin.tsx` keeps decrementing to 0 even while offline → player sees timer expire incorrectly.
  2. If `refetchGameState` runs and momentarily fails or returns partial data, the UI re-renders with mixed values.
  3. If the server transitioned (e.g. `question` → `results`) while the player was offline, on reconnect they jump straight to the new screen with no transition / awareness.
  4. Answer taps while offline silently no-op (`submitAnswer` calls `supabase.functions.invoke` which fails).

## Plan

### 1. Snapshot last-known good state — `src/hooks/usePlayerGame.ts`

- Add a `lastSnapshotRef` that stores the most recent `PlayerGameState` received from a confirmed realtime/refetch update.
- Persist the snapshot to `localStorage` (under `player_session_v1_snapshot`) on every successful update so a refresh during a disconnect still restores the last visible screen.
- Expose `state` to the UI as `disconnected ? snapshot ?? state : state` — i.e. while disconnected we serve the frozen snapshot, ignoring any partial / transient writes.
- Only update the snapshot when the update came from a real `postgres_changes` payload or a successful `refetchGameState`, never from connection-status side effects.

### 2. Freeze the local countdown while disconnected — `src/pages/PlayerJoin.tsx`

- Pause the `setInterval` decrementing `localTimer` whenever `state.disconnected` is true.
- Do not reset `localTimer` from `state.timeRemaining` while disconnected.
- On reconnect (`disconnected` flips back to false), resync `localTimer` to the fresh `state.timeRemaining`.

### 3. Queue answer submissions while offline — `src/hooks/usePlayerGame.ts`

- Add a `pendingAnswerRef` that holds the latest tap (`{ questionId, answer, timeTaken, takenAt }`) if `submitAnswer` is called while `disconnected` or while `navigator.onLine === false`.
- Optimistically set `answerSubmitted: true` so the player sees the "תשובה נשלחה" screen immediately and doesn't re-tap.
- On successful reconnect (channel `SUBSCRIBED` again), flush the pending answer via `supabase.functions.invoke("submit-answer", …)`. If the server has already moved past that question, drop it silently.

### 4. Smooth transition on reconnect

- When reconnecting and the server's `gameStatus` / `currentQuestionIndex` differ from the snapshot, wait one tick and apply the new state inside an `AnimatePresence` fade rather than a hard swap. This is achieved by keying the top-level `motion.div` in each branch of `PlayerJoin.tsx` on `gameStatus + currentQuestionIndex`, so framer-motion runs its existing fade-in instead of a flash.

### 5. Connection banner copy tweak — `src/components/game/ConnectionStatusBanner.tsx`

- Update banner text to make the "frozen" behavior explicit, e.g. "החיבור אבד — המסך יתעדכן כשנחזור לאוויר" so the player understands why the screen isn't moving.

## Files to change

- `src/hooks/usePlayerGame.ts` — snapshot logic, queued answer, freeze-on-disconnect selector
- `src/pages/PlayerJoin.tsx` — pause local timer, key motion divs for smooth transitions
- `src/components/game/ConnectionStatusBanner.tsx` — copy update

## Out of scope

- No DB / RLS / edge-function changes.
- No new dependencies.

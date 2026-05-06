# Plan

## 1. CI: guard against broad storage policies reappearing

Add a new GitHub Actions workflow `.github/workflows/storage-rls-guard.yml` that runs on every push/PR touching `supabase/migrations/**` and on a daily schedule.

Steps:
- Check required secrets `SUPABASE_DB_URL` (or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) are present; fail with a clear error if not.
- Run a SQL probe via `psql $SUPABASE_DB_URL -c "..."` (install postgresql-client) that selects from `pg_policy` joined with `pg_class`/`pg_namespace` filtered to `storage.objects`, looking for policies whose `polqual`/`polwithcheck` mention `bucket_id = 'background-music'` or `bucket_id = 'branding-assets'` **without** referencing `owner` / `auth.uid()`.
- Also blacklist by name the six previously-removed policies (`Authenticated can upload background music`, `…update…`, `…delete…`, `Authenticated upload branding-assets`, `…update…`, `…delete…`).
- If any forbidden row is returned, print it and `exit 1`.

This makes future regressions of `storage_branding_music_broad_write` fail the build automatically.

## 2. Hide Yemot integration; surface only the public number

- Remove the visible "📞 הגדר ימות" button from `src/components/game/GameLobby.tsx` (lines ~362-374).
- Keep the `/yemot-setup` route mounted (so admins with the URL can still reach it) but unlinked from any UI.
- In the lobby, replace the button with a small static info line: `התקשרו ל־0772267604 כדי להצטרף בטלפון` (no dial action — matches the existing static-number rule).
- Update the IVR welcome flow in `supabase/functions/yemot-ivr/logic.ts` so the very first response a caller hears (when `joined_intro` is unset) plays:
  1. a configurable greeting audio file (uploaded to `ivr2:sounds/welcome` — see open question below), then
  2. the TTS line `"הנך מחובר למשחק"`.

Implementation: extend `Decision` of `kind: "wait"` to optionally accept a `prefixFile` so `read=` can be rendered as `f-ivr2:sounds/welcome.t-...=joined_intro,...`. Adjust `renderDecision` accordingly and add unit tests in `logic_test.ts`.

## 3. Allow joining at any phase until host "locks" the game

Today `join_phone_player` only sets `joined_in_lobby = true` while `status='lobby'` (plus a 30s first-question grace). The new behavior: callers can join at any time and play from the next question onward — until the host explicitly locks the game.

Database migration:
- Add column `games.locked boolean NOT NULL DEFAULT false`.
- Update `join_phone_player` so `v_in_lobby := NOT v_game.locked AND v_game.status <> 'finished'`. Drop the start_at grace and first-question recovery branches (no longer needed). Keep the audit log entries.
- Update `submit_phone_answer` unchanged (still gated by `joined_in_lobby` + `current_question_index` match, so a freshly joined caller simply can't answer questions that already passed).

Host UI:
- Add a "נעל משחק" toggle button near the host controls (`src/pages/GameHost.tsx`). When pressed, it calls `supabase.from('games').update({ locked: true }).eq('id', gameDbId)`. A second press unlocks.
- Show lock state in `HostLiveStatusPanel`.

IVR:
- Drop the `classifyJoiner` "recovery"/"late" distinction in favor of a simpler `locked`/`unlocked` model. Late joiners admitted mid-game now hear: `"הצטרפת בהצלחה. השאלה הנוכחית כבר החלה — תוכל לענות מהשאלה הבאה."` once, then poll silently with the hourglass loop.

## 4. Sync: question must render before timer starts

Current `GameQuestionDisplay` already calls `startHourglass` after a 1s delay and exposes `onReady?.()`. Wire `onReady` end-to-end:

- `GameQuestionDisplay` calls `onReady?.()` only **after** the entrance animation completes (use `onAnimationComplete` on the question card instead of a fixed 1s `setTimeout`).
- `GameHost.tsx` passes `onReady={() => game.startTimer()}`. Add a `startTimer()` action to `useGameStore` that flips a `timerRunning` flag the existing 1Hz tick checks before decrementing `time_remaining`.
- The Supabase `games.time_remaining` countdown only begins after `startTimer()` (host calls `supabase.from('games').update({ time_remaining: question.timeLimit }).eq(...)` inside `startTimer`, then ticks).
- IVR `logic.ts`: while `status='question'` but `time_remaining === question.timeLimit` AND no caller has been served `qintro` yet, return the intro `read=` (instruction "הקש 1, 2, 3 או 4") only — no hourglass — so the audio doesn't start before the host's screen is ready. The hourglass loop kicks in on the next poll.

Result: visual question reveal + audio cue + countdown all start in the same frame across host screen and phone callers.

## 5. Tests

- Extend `supabase/functions/yemot-ivr/logic_test.ts`:
  - new welcome-prefix file rendering
  - locked-game rejection
  - mid-game join → "answer from next question" intro
  - `qintro` no-hourglass branch when `time_remaining == timeLimit`
- Update existing tests that asserted the 30s recovery/late text.

## Open question

The user mentioned attaching a welcome audio file ("קובץ שאצרף") but no file was attached. Two options:
- (a) I scaffold the IVR to play `ivr2:sounds/welcome` and you upload the file to Yemot under that name later, OR
- (b) you attach the audio now and I include upload instructions / store it in the `background-music` bucket and stream the URL.

I'll proceed with (a) unless you say otherwise.

## Files touched

- `.github/workflows/storage-rls-guard.yml` (new)
- `src/components/game/GameLobby.tsx`
- `src/pages/GameHost.tsx`
- `src/hooks/useGameStore.ts`
- `src/components/game/GameQuestionDisplay.tsx`
- `src/components/game/HostLiveStatusPanel.tsx`
- `supabase/functions/yemot-ivr/logic.ts`
- `supabase/functions/yemot-ivr/logic_test.ts`
- new DB migration: add `games.locked`, rewrite `join_phone_player`

/** True when the scheduled event time has arrived and the game is still waiting in the lobby. */
export function shouldAutoStart(eventAt: string | null | undefined, now: number, status: string, alreadyStarted: boolean): boolean {
  if (!eventAt || alreadyStarted || status !== "lobby") return false;
  const t = new Date(eventAt).getTime();
  if (Number.isNaN(t)) return false;
  // Only fire within 2 hours after the scheduled time, so an old date doesn't start a new game.
  return now >= t && now - t < 2 * 60 * 60 * 1000;
}

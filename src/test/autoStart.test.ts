import { describe, expect, it } from "vitest";
import { shouldAutoStart } from "@/lib/autoStart";

const at = "2026-11-22T18:00:00.000Z";
const t = new Date(at).getTime();

describe("auto start at the scheduled game time", () => {
  it("does not start before the time", () => expect(shouldAutoStart(at, t - 1000, "lobby", false)).toBe(false));
  it("starts once the time arrives while in lobby", () => expect(shouldAutoStart(at, t + 1000, "lobby", false)).toBe(true));
  it("does not start twice or outside the lobby", () => {
    expect(shouldAutoStart(at, t + 1000, "lobby", true)).toBe(false);
    expect(shouldAutoStart(at, t + 1000, "question", false)).toBe(false);
  });
  it("ignores a date that passed more than 2 hours ago", () => expect(shouldAutoStart(at, t + 3 * 3600_000, "lobby", false)).toBe(false));
});

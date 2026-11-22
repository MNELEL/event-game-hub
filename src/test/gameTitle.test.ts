import { describe, expect, it } from "vitest";
import { getGameTitle } from "@/lib/gameTitle";

describe("session game name", () => {
  it("keeps the host's custom game name verbatim", () => {
    expect(getGameTitle({ title: "סיום מסכת — בדיקת משחק" })).toBe("סיום מסכת — בדיקת משחק");
  });
  it("defaults an unnamed game to מגה טריוויה", () => {
    expect(getGameTitle({ title: "  " })).toBe("מגה טריוויה");
    expect(getGameTitle(null)).toBe("מגה טריוויה");
  });
});
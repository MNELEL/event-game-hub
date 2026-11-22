import { describe, expect, it } from "vitest";
import { defaultQuestions } from "@/data/defaultQuestions";

describe("reviewed default question bank", () => {
  it("does not reseed the seven question topics removed in the Haredi review", () => {
    const removedIds = ["g4", "e1", "e2", "e3", "sp1", "sp2", "sp3"];
    expect(defaultQuestions.filter(q => removedIds.includes(q.id))).toEqual([]);
    expect(defaultQuestions.some(q => ["entertainment", "sports"].includes(q.category))).toBe(false);
    expect(defaultQuestions.find(q => q.id === "j1")?.correctAnswer).toBe(2);
  });
});
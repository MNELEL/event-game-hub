import { describe, expect, it } from "vitest";
import { liveJoinLink, whatsappChatUrl } from "@/lib/whatsapp";

describe("whatsapp links", () => {
  it("join link points to the live site", () => {
    expect(liveJoinLink("1234")).toBe("https://megatrivia.lovable.app/play?code=1234");
  });
  it("contact chat targets the business number", () => {
    expect(whatsappChatUrl("hi")).toBe("https://wa.me/972772267604?text=hi");
  });
});

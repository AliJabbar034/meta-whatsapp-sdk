import { describe, expect, it } from "vitest";
import { verifyWebhook } from "./webhook";

describe("verifyWebhook", () => {
  it("returns challenge when mode and token are valid", () => {
    const challenge = verifyWebhook(
      "subscribe",
      "expected-token",
      "challenge-value",
      "expected-token"
    );

    expect(challenge).toBe("challenge-value");
  });

  it("throws when mode is invalid", () => {
    expect(() =>
      verifyWebhook("invalid", "expected-token", "challenge", "expected-token")
    ).toThrow("Webhook verification failed");
  });

  it("throws when token does not match", () => {
    expect(() =>
      verifyWebhook("subscribe", "wrong-token", "challenge", "expected-token")
    ).toThrow("Webhook verification failed");
  });
});

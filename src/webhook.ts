export function verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ) {
    if (mode === "subscribe" && token === verifyToken) {
      return challenge;
    }
    throw new Error("Webhook verification failed");
  }
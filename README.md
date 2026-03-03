# meta-whatsapp-sdk

A lightweight TypeScript SDK for the Meta WhatsApp Cloud API.

It provides a simple client with:
- text, template, media, and interactive message helpers
- optional retry with backoff
- optional rate limiting
- webhook verification utility
- typed error handling

## Why This SDK

The Meta WhatsApp Cloud API is powerful but repetitive to integrate directly for every project.

This SDK exists to give developers a minimal, reliable, and fast way to ship WhatsApp messaging features without rewriting the same boilerplate each time.

## Benefits and How It Helps

- Faster integration: start sending messages with a small config object.
- Cleaner code: use simple methods like `sendText`, `sendTemplate`, and `sendInteractive`.
- Better reliability by default: built-in retry and optional rate limiting.
- Easier onboarding for teams: consistent API shape and practical docs.
- Production-friendly error handling: `WhatsAppError` includes status and Meta error code.
- Optional complexity: start send-only, add webhooks/inbound handling only when needed.

## Why Developers Choose This

- Less boilerplate: no repeated Axios setup, payload shaping, and error parsing in every project.
- Better defaults: retry and rate-limit support are already available when traffic grows.
- Faster debugging: Meta status and error codes are surfaced directly through `WhatsAppError`.
- Easy to scale from MVP to production: start with `sendText`, then add templates, media, and webhooks.
- Team-friendly API: consistent method naming and typed payloads reduce onboarding time.
- Minimal lock-in: built on official Meta Cloud API primitives, not a heavy abstraction layer.


Setup Meta assets step-by-step: [`META_SETUP_GUIDE.md`](./META_SETUP_GUIDE.md)

## Installation

```bash
npm install meta-whatsapp-sdk
```

## Testing

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Quick Start

```ts
import { WhatsAppClient } from "meta-whatsapp-sdk";

const client = new WhatsAppClient({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  version: "v19.0",
});

await client.sendText("15551234567", "Hello from the SDK");
```

## Client Configuration

```ts
import { WhatsAppClient } from "meta-whatsapp-sdk";

const client = new WhatsAppClient({
  accessToken: "EAAG...",
  phoneNumberId: "1234567890",
  version: "v19.0", // optional, defaults to v19.0
  timeout: 10000, // optional
  debug: true, // optional
  retry: {
    retries: 3, // optional, default: 3
    backoff: "exponential", // "fixed" | "exponential", default: "exponential"
    initialDelay: 1000, // optional, default: 1000ms
    retryOn: (error) => {
      // optional custom retry condition
      // return true to retry, false to stop
      return true;
    },
  },
  rateLimit: {
    maxRequests: 80,
    perMilliseconds: 60_000,
  },
});
```

## Sending Messages

### 1) Text

```ts
await client.sendText("15551234567", "Order confirmed. Thanks!");
```

### 2) Template

```ts
await client.sendTemplate("15551234567", {
  name: "order_update",
  language: { code: "en_US" },
  components: [
    {
      type: "body",
      parameters: [
        { type: "text", text: "John" },
        { type: "text", text: "#A-1024" },
      ],
    },
  ],
});
```

### 3) Media (Image, Video, Document, Audio)

Pass media either by `link` or by uploaded media `id`.

```ts
// Image
await client.sendImage(
  "15551234567",
  { link: "https://example.com/invoice.png" },
  { caption: "Your invoice" }
);

// Video
await client.sendVideo(
  "15551234567",
  { id: "123456_media_id" },
  { caption: "Product walkthrough" }
);

// Document
await client.sendDocument(
  "15551234567",
  { link: "https://example.com/guide.pdf" },
  { caption: "Quick guide", filename: "guide.pdf" }
);

// Audio
await client.sendAudio("15551234567", { link: "https://example.com/voice.mp3" });
```

### 4) Interactive Messages

#### Reply Buttons

```ts
await client.sendInteractive("15551234567", {
  type: "button",
  body: { text: "Would you like to confirm your booking?" },
  action: {
    buttons: [
      { type: "reply", reply: { id: "confirm_yes", title: "Yes" } },
      { type: "reply", reply: { id: "confirm_no", title: "No" } },
    ],
  },
});
```

#### List

```ts
await client.sendInteractive("15551234567", {
  type: "list",
  body: { text: "Choose a support topic" },
  action: {
    button: "View options",
    sections: [
      {
        title: "Billing",
        rows: [
          { id: "invoice_copy", title: "Need invoice copy" },
          { id: "refund_status", title: "Check refund status" },
        ],
      },
      {
        title: "Orders",
        rows: [{ id: "track_order", title: "Track my order" }],
      },
    ],
  },
});
```

## Webhook Verification

Use `verifyWebhook` in your webhook GET route to complete Meta's verification challenge.

```ts
import { verifyWebhook } from "meta-whatsapp-sdk";

const challenge = verifyWebhook(
  mode,
  token,
  challengeFromMeta,
  process.env.WHATSAPP_VERIFY_TOKEN!
);
```

### Express Example (recommended)

```ts
import express from "express";
import { verifyWebhook } from "meta-whatsapp-sdk";

const app = express();

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  try {
    const response = verifyWebhook(
      String(mode ?? ""),
      String(token ?? ""),
      String(challenge ?? ""),
      process.env.WHATSAPP_VERIFY_TOKEN!
    );
    return res.status(200).send(response);
  } catch {
    return res.sendStatus(403);
  }
});

app.post("/webhook", express.json(), (req, res) => {
  // Handle inbound events here (messages, statuses, etc).
  // Always acknowledge quickly to avoid retries from Meta.
  res.sendStatus(200);
});
```

### Webhook Events You Can Receive

Most payloads come under `entry[].changes[]`, with `changes[].value` containing the event data.

- `messages`: inbound customer messages
  - text messages
  - interactive replies (button/list)
  - media messages (image/video/audio/document)
  - location, contacts, and other supported message types
- `statuses`: delivery lifecycle updates for messages you sent
  - `sent`
  - `delivered`
  - `read`
  - `failed` (includes error details)
- `errors`: webhook-level or message-level errors (usually included with failed statuses)
- `contacts`: contact info attached to inbound messages (for example, wa_id and profile name)
- `metadata`: business phone number metadata (for example, `phone_number_id`, display number)

Tip: log `req.body` in development and branch logic by checking whether `value.messages` or `value.statuses` exists.

### Developer Notes

- `verifyWebhook` throws if `mode !== "subscribe"` or token mismatch.
- Use the same `WHATSAPP_VERIFY_TOKEN` value in both Meta App settings and your server env.
- Convert query values to strings before passing to `verifyWebhook` to avoid type edge cases.
- Return `200` with the challenge string on success, `403` on failure.

## Error Handling

SDK errors are wrapped in `WhatsAppError`:

```ts
import { WhatsAppError } from "meta-whatsapp-sdk";

try {
  await client.sendText("15551234567", "Hi");
} catch (error) {
  if (error instanceof WhatsAppError) {
    console.error(error.message);
    console.error(error.status);
    console.error(error.metaCode);
  }
}
```

## Message Delivery Troubleshooting

### Failed with `status: "failed"` and Meta error `131047` (Re-engagement message)

This means:

- More than 24 hours have passed since the user last replied.
- You cannot send free-form text messages (like `sendText`) outside that 24-hour window.
- You must send an approved template message first to reopen the conversation.

What to do:

1. Send an approved template to that user (`sendTemplate`).
2. Wait for the user to reply.
3. After that reply, normal `sendText` works again for the next 24 hours.

Practical setup:

- In Meta dashboard, create/approve a simple template (for example `hello_world`).
- Add a server endpoint that calls `sendTemplate` (for example `POST /send-template`).

Example payload for your server endpoint:

```json
{
  "to": "923084041419",
  "name": "hello_world",
  "languageCode": "en_US"
}
```

## Exported Types

The package exports all public types from `src/types.ts`, including:
- `ClientConfig`
- `RetryOptions`
- `RateLimitOptions`
- `TemplateMessage`, `TemplateComponent`, `TemplateParameter`
- `InteractiveMessage`
- `MediaObject`

## Notes

- Phone numbers should follow WhatsApp Cloud API expectations (typically E.164 digits).
- This SDK focuses on common send-message workflows with ergonomic helpers.
- For advanced payloads, you can extend types or add additional helper methods.

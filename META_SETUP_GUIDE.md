# Meta WhatsApp Cloud API Setup Guide

This guide helps you configure Meta assets required to use this SDK in development and production.

## Official References

- Cloud API overview: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Get started: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/
- Webhooks setup: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
- Webhook message events reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/reference/messages/
- Access tokens: https://developers.facebook.com/docs/whatsapp/access-tokens/
- Send messages API reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/

## Prerequisites

- A Meta Developer account.
- A Meta Business account.
- A WhatsApp Business Account (WABA).
- A phone number that can be connected to WhatsApp Business Platform.
- A public HTTPS endpoint for webhook events (valid TLS certificate required).

## Step 1: Create a Meta App

1. Open Meta App Dashboard: https://developers.facebook.com/apps/
2. Create a new app (Business type).
3. Add the **WhatsApp** product to your app.
4. In the WhatsApp product panel, open the getting started flow.

## Step 2: Get Initial Credentials

From the WhatsApp product dashboard, copy these values:

- `Phone Number ID`
- `WhatsApp Business Account ID`
- Temporary `Access Token` (for quick testing)

You will use them in your server env vars:

```bash
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=choose-a-secret-token
```

## Step 3: Send a Test Message

1. Add your own number as a test recipient in the Meta dashboard.
2. Use this SDK with your temporary token and phone number ID.
3. Send a basic text to validate connectivity.

```ts
import { WhatsAppClient } from "meta-whatsapp-sdk";

const client = new WhatsAppClient({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

await client.sendText("15551234567", "Setup successful");
```

## Step 4: Configure Webhook Endpoint

1. Implement `GET /webhook` verification route and `POST /webhook` event route.
2. Deploy on a public HTTPS URL.
3. In Meta dashboard, set:
   - Callback URL: `https://your-domain.com/webhook`
   - Verify token: same as `WHATSAPP_VERIFY_TOKEN`
4. Complete verification challenge.
5. Subscribe to webhook fields you need (typically message-related fields).

Use this SDK helper for the GET verification:

```ts
import { verifyWebhook } from "meta-whatsapp-sdk";

const challenge = verifyWebhook(
  mode,
  token,
  challengeFromMeta,
  process.env.WHATSAPP_VERIFY_TOKEN!
);
```

## Step 5: Handle Incoming Events

Your `POST /webhook` should:

- Parse `req.body.entry[].changes[].value`.
- Handle `messages` (inbound user messages).
- Handle `statuses` (sent, delivered, read, failed).
- Respond with `200` quickly to avoid Meta retries.

## Step 6: Move to Production

For production readiness:

1. Use a long-lived token strategy (system user token) per Meta access token docs.
2. Rotate secrets and store them in a secure secret manager.
3. Enable app mode and complete required business verification steps in Meta.
4. Use approved message templates where needed by policy.
5. Add observability (request logs, failed status tracking, alerting).

## Common Setup Issues

- **Webhook verify fails**: verify token mismatch between dashboard and server env.
- **401/403 API calls**: invalid or expired token.
- **Message not delivered**: recipient not allowed in test mode, or template/policy issue.
- **No webhook events**: callback URL not public HTTPS, subscription not enabled, or handler not returning `200`.

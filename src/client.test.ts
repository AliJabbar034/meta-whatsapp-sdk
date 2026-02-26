import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InteractiveMessage, TemplateMessage } from "./types";
import { WhatsAppError } from "./errors";

const { postMock, createMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: createMock,
  },
}));

import { WhatsAppClient } from "./client";

describe("WhatsAppClient", () => {
  beforeEach(() => {
    postMock.mockReset();
    createMock.mockReset();
    createMock.mockReturnValue({ post: postMock });
    postMock.mockResolvedValue({ data: { id: "wamid.123" } });
  });

  const makeClient = () =>
    new WhatsAppClient({
      accessToken: "token",
      phoneNumberId: "12345",
      retry: { retries: 0, initialDelay: 0 },
    });

  it("creates axios instance with expected defaults", () => {
    makeClient();

    expect(createMock).toHaveBeenCalledWith({
      baseURL: "https://graph.facebook.com/v19.0",
      timeout: 10000,
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json",
      },
    });
  });

  it("sends text payload", async () => {
    const client = makeClient();
    await client.sendText("15551234567", "hello");

    expect(postMock).toHaveBeenCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "text",
      text: { body: "hello" },
    });
  });

  it("sends template payload", async () => {
    const client = makeClient();
    const template: TemplateMessage = {
      name: "order_update",
      language: { code: "en_US" },
      components: [
        { type: "body", parameters: [{ type: "text", text: "John" }] },
      ],
    };

    await client.sendTemplate("15551234567", template);

    expect(postMock).toHaveBeenCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "template",
      template,
    });
  });

  it("sends media payloads", async () => {
    const client = makeClient();

    await client.sendImage("15551234567", { link: "https://example.com/a.jpg" }, { caption: "caption" });
    expect(postMock).toHaveBeenLastCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "image",
      image: { link: "https://example.com/a.jpg", caption: "caption" },
    });

    await client.sendVideo("15551234567", { id: "media-id" });
    expect(postMock).toHaveBeenLastCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "video",
      video: { id: "media-id" },
    });

    await client.sendDocument("15551234567", { id: "doc-id" }, { filename: "doc.pdf" });
    expect(postMock).toHaveBeenLastCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "document",
      document: { id: "doc-id", filename: "doc.pdf" },
    });

    await client.sendAudio("15551234567", { link: "https://example.com/a.mp3" });
    expect(postMock).toHaveBeenLastCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "audio",
      audio: { link: "https://example.com/a.mp3" },
    });
  });

  it("sends interactive payload", async () => {
    const client = makeClient();
    const interactive: InteractiveMessage = {
      type: "button",
      body: { text: "Confirm?" },
      action: {
        buttons: [{ type: "reply", reply: { id: "yes", title: "Yes" } }],
      },
    };

    await client.sendInteractive("15551234567", interactive);

    expect(postMock).toHaveBeenCalledWith("/12345/messages", {
      messaging_product: "whatsapp",
      to: "15551234567",
      type: "interactive",
      interactive,
    });
  });

  it("wraps API errors into WhatsAppError", async () => {
    const client = makeClient();
    postMock.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: {
            message: "Invalid recipient",
            code: 131047,
          },
        },
      },
    });

    await expect(client.sendText("15551234567", "hello")).rejects.toMatchObject({
      message: "Invalid recipient",
      status: 400,
      metaCode: 131047,
    });
  });

  it("returns WhatsAppError instance on failure", async () => {
    const client = makeClient();
    postMock.mockRejectedValueOnce(new Error("network"));

    await expect(client.sendText("15551234567", "hello")).rejects.toBeInstanceOf(
      WhatsAppError
    );
  });
});

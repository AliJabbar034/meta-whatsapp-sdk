import axios, { AxiosInstance } from "axios";
import {
  ClientConfig,
  InteractiveMessage,
  MediaObject,
  ResolvedRetryOptions,
  TemplateMessage,
} from "./types";
import { retryRequest } from "./retry";
import { createLimiter } from "./rateLimiter";
import { WhatsAppError } from "./errors";

export class WhatsAppClient {
  private axios: AxiosInstance;
  private phoneNumberId: string;
  private debug: boolean;
  private retryOptions: ResolvedRetryOptions;
  private limiter: any;

  constructor(config: ClientConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.debug = config.debug ?? false;

    this.retryOptions = {
      retries: config.retry?.retries ?? 3,
      backoff: config.retry?.backoff ?? "exponential",
      initialDelay: config.retry?.initialDelay ?? 1000,
      retryOn: config.retry?.retryOn,
    };

    this.limiter = createLimiter(config.rateLimit);

    this.axios = axios.create({
      baseURL: `https://graph.facebook.com/${config.version || "v19.0"}`,
      timeout: config.timeout ?? 10000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  private async execute(payload: any) {
    const send = async () => {
      const response = await this.axios.post(
        `/${this.phoneNumberId}/messages`,
        payload
      );
      return response.data;
    };

    const wrapped = () =>
      this.limiter ? this.limiter.schedule(send) : send();

    try {
      return await retryRequest(wrapped, this.retryOptions, this.debug);
    } catch (error: any) {
      throw new WhatsAppError(
        error?.response?.data?.error?.message || "WhatsApp API error",
        error?.response?.status,
        error?.response?.data?.error?.code
      );
    }
  }

  async sendText(to: string, message: string) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    });
  }

  async sendTemplate(to: string, template: TemplateMessage) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    });
  }

  async sendImage(
    to: string,
    image: MediaObject,
    options?: { caption?: string }
  ) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: {
        ...image,
        ...(options?.caption ? { caption: options.caption } : {}),
      },
    });
  }

  async sendVideo(
    to: string,
    video: MediaObject,
    options?: { caption?: string }
  ) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "video",
      video: {
        ...video,
        ...(options?.caption ? { caption: options.caption } : {}),
      },
    });
  }

  async sendDocument(
    to: string,
    document: MediaObject,
    options?: { caption?: string; filename?: string }
  ) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: {
        ...document,
        ...(options?.caption ? { caption: options.caption } : {}),
        ...(options?.filename ? { filename: options.filename } : {}),
      },
    });
  }

  async sendAudio(to: string, audio: MediaObject) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "audio",
      audio,
    });
  }

  async sendInteractive(to: string, interactive: InteractiveMessage) {
    return this.execute({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive,
    });
  }
}
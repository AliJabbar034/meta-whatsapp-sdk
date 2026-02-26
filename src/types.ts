export interface RetryOptions {
  retries?: number;
  backoff?: "fixed" | "exponential";
  initialDelay?: number;
  retryOn?: (error: unknown) => boolean;
}

export interface ResolvedRetryOptions {
  retries: number;
  backoff: "fixed" | "exponential";
  initialDelay: number;
  retryOn?: (error: unknown) => boolean;
}

export interface RateLimitOptions {
  maxRequests: number;
  perMilliseconds: number;
}

export interface ClientConfig {
  accessToken: string;
  phoneNumberId: string;
  version?: string;
  timeout?: number;
  debug?: boolean;
  retry?: RetryOptions;
  rateLimit?: RateLimitOptions;
}

export type MediaObject = { id: string } | { link: string };

export interface TemplateLanguage {
  code: string;
  policy?: "deterministic";
}

export type TemplateParameter =
  | { type: "text"; text: string }
  | {
      type: "currency";
      currency: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
    }
  | { type: "date_time"; date_time: { fallback_value: string } }
  | { type: "image"; image: MediaObject }
  | { type: "video"; video: MediaObject }
  | { type: "document"; document: MediaObject };

export type TemplateComponent =
  | { type: "header"; parameters: TemplateParameter[] }
  | { type: "body"; parameters: TemplateParameter[] }
  | { type: "button"; sub_type: "quick_reply" | "url"; index: string; parameters: TemplateParameter[] };

export interface TemplateMessage {
  name: string;
  language: TemplateLanguage;
  components?: TemplateComponent[];
}

export interface InteractiveHeaderText {
  type: "text";
  text: string;
}

export interface InteractiveHeaderMedia {
  type: "image" | "video" | "document";
  image?: MediaObject;
  video?: MediaObject;
  document?: MediaObject;
}

export type InteractiveHeader = InteractiveHeaderText | InteractiveHeaderMedia;

export interface InteractiveBody {
  text: string;
}

export interface InteractiveFooter {
  text: string;
}

export interface InteractiveReplyButton {
  id: string;
  title: string;
}

export interface InteractiveSectionRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveSection {
  title?: string;
  rows: InteractiveSectionRow[];
}

export interface InteractiveButtonMessage {
  type: "button";
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  action: {
    buttons: Array<{
      type: "reply";
      reply: InteractiveReplyButton;
    }>;
  };
}

export interface InteractiveListMessage {
  type: "list";
  header?: InteractiveHeader;
  body: InteractiveBody;
  footer?: InteractiveFooter;
  action: {
    button: string;
    sections: InteractiveSection[];
  };
}

export type InteractiveMessage = InteractiveButtonMessage | InteractiveListMessage;
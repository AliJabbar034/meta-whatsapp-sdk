import { ResolvedRetryOptions } from "./types";

export async function retryRequest(
  fn: () => Promise<unknown>,
  options: ResolvedRetryOptions,
  debug: boolean
) {
  let attempt = 0;

  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error: unknown) {
      const errorStatus =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status ===
          "number"
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      const shouldRetry = options.retryOn?.(error) ?? (errorStatus ?? 0) >= 500;

      if (!shouldRetry || attempt === options.retries) {
        throw error;
      }

      const delay =
        options.backoff === "fixed"
          ? options.initialDelay
          : options.initialDelay * Math.pow(2, attempt);

      if (debug) {
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      }

      await new Promise((res) => setTimeout(res, delay));
      attempt++;
    }
  }
}
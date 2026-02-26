import { describe, expect, it, vi } from "vitest";
import { retryRequest } from "./retry";
import { ResolvedRetryOptions } from "./types";

const baseOptions: ResolvedRetryOptions = {
  retries: 2,
  backoff: "fixed",
  initialDelay: 0,
};

describe("retryRequest", () => {
  it("retries on 5xx errors and eventually resolves", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue("ok");

    const result = await retryRequest(fn, baseOptions, false);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry on 4xx errors by default", async () => {
    const error = { response: { status: 400 } };
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);

    await expect(retryRequest(fn, baseOptions, false)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses custom retryOn when provided", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockResolvedValue("recovered");

    const result = await retryRequest(
      fn,
      {
        ...baseOptions,
        retries: 1,
        retryOn: () => true,
      },
      false
    );

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

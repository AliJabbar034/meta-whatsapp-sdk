import Bottleneck from "bottleneck";
import { RateLimitOptions } from "./types";

export function createLimiter(config?: RateLimitOptions) {
  if (!config) return null;

  return new Bottleneck({
    reservoir: config.maxRequests,
    reservoirRefreshAmount: config.maxRequests,
    reservoirRefreshInterval: config.perMilliseconds,
  });
}
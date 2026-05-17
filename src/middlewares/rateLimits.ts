import rateLimit from "express-rate-limit";
import { config } from "../config";

/** General API traffic (per IP) */
export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limit for short-link creation (abuse prevention) */
export const shortCreationRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_SHORT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many shorten requests; try again later",
    errorCode: "RATE_LIMITED",
  },
});

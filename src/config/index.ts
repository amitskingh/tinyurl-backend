import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const int = (v: string | undefined, fallback: number) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  PORT: int(process.env.PORT, 3000),
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",

  clickChannel: process.env.CLICK_CHANNEL || "clickUpdates",

  /** MaxMind GeoIP (optional; click worker degrades if missing) */
  AccountID: process.env.AccountID,
  LicenseKey: process.env.LicenseKey,

  JWT_SECRET: process.env.JWT_SECRET || "dev-only-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  /** Random short code length (Base62). 7–8 chars is a common tradeoff. */
  SHORT_CODE_LENGTH: Math.min(
    12,
    Math.max(6, int(process.env.SHORT_CODE_LENGTH, 8))
  ),
  /** Max attempts to draw a non-colliding short code */
  SHORT_CODE_MAX_ATTEMPTS: int(process.env.SHORT_CODE_MAX_ATTEMPTS, 8),

  /** Redis cache TTL (seconds) for redirect target */
  ALIAS_CACHE_TTL_SEC: int(process.env.ALIAS_CACHE_TTL_SEC, 86_400),

  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  RATE_LIMIT_WINDOW_MS: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  RATE_LIMIT_MAX: int(process.env.RATE_LIMIT_MAX, 300),
  RATE_LIMIT_SHORT_MAX: int(process.env.RATE_LIMIT_SHORT_MAX, 30),
} as const;

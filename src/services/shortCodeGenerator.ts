import { randomInt } from "crypto";
import { config } from "../config";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Cryptographically strong, non-sequential short codes using Base62.
 * Uniqueness is enforced in the database; collisions trigger a retry in the service layer.
 */
export function generateShortCode(
  length: number = config.SHORT_CODE_LENGTH
): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62[randomInt(0, 62)]!;
  }
  return out;
}

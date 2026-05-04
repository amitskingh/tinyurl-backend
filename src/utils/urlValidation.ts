import APIError from "../errors/APIError";

function isPrivateOrLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0") return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = h.match(ipv4);
  if (m) {
    const oct = [m[1], m[2], m[3], m[4]].map((x) => parseInt(x!, 10));
    if (oct.some((n) => n > 255)) return true;
    const [a, b] = oct;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  return false;
}

/**
 * Normalizes input, validates URL shape, and blocks obvious SSRF targets (link-local / private hosts).
 */
export function normalizeAndValidateDestinationUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new APIError(400, "Invalid URL format", "INVALID_URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new APIError(400, "Only http and https URLs are allowed", "INVALID_URL");
  }

  if (isPrivateOrLocalHostname(parsed.hostname)) {
    throw new APIError(400, "URL host is not allowed", "URL_NOT_ALLOWED");
  }

  return parsed.toString();
}

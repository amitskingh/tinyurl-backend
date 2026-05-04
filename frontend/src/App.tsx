import { useCallback, useMemo, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { MyLinksPanel } from "./components/MyLinksPanel";
import { useAuth } from "./context/AuthContext";
import { apiFetch, apiPrefix } from "./lib/api";

type ApiSuccess = {
  status: "success";
  data: {
    alias: { alias: string | null };
    longURL: { originalUrl: string };
  };
};

type ApiErrorBody = {
  status: "error";
  message: string;
  errorCode?: string;
  details?: Record<string, string[] | undefined>;
};

function normalizeUrlInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const { getIdToken } = useAuth();
  const [longURL, setLongURL] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resolvedShortUrl = useMemo(() => {
    if (!shortLink) return null;
    if (shortLink.startsWith("http")) return shortLink;
    const origin =
      import.meta.env.VITE_PUBLIC_ORIGIN ?? window.location.origin;
    return `${origin}${shortLink}`;
  }, [shortLink]);

  const submit = useCallback(async () => {
    setError(null);
    setCopied(false);
    const normalized = normalizeUrlInput(longURL);
    if (!normalized) {
      setError("Enter a URL to shorten.");
      return;
    }
    if (!isValidHttpUrl(normalized)) {
      setError("Invalid URL format.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { longURL: normalized };
      if (customAlias.trim()) body.customAlias = customAlias.trim();
      const n = Number(expiresInDays);
      if (expiresInDays.trim() && Number.isFinite(n) && n > 0) {
        body.expiresInDays = Math.floor(n);
      }

      const token = await getIdToken();

      const res = await apiFetch("/api/v1/short", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      });

      const json = (await res.json()) as ApiSuccess | ApiErrorBody;

      if (!res.ok || json.status !== "success") {
        const err = json as ApiErrorBody;
        const msg =
          err.details && Object.keys(err.details).length
            ? `${err.message}: ${JSON.stringify(err.details)}`
            : err.message || "Request failed";
        setError(msg);
        return;
      }

      const alias = json.data.alias.alias;
      if (!alias) {
        setError("Server did not return a short code.");
        return;
      }

      setShortLink(`${apiPrefix}/api/v1/${encodeURIComponent(alias)}`);
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }, [getIdToken, longURL, customAlias, expiresInDays]);

  const copy = useCallback(async () => {
    if (!resolvedShortUrl) return;
    try {
      await navigator.clipboard.writeText(resolvedShortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }, [resolvedShortUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Tiny URL
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to save links to your account and view analytics. You can
            still shorten without an account.
          </p>
        </header>

        <AuthPanel />

        <form
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h2 className="text-lg font-medium text-white text-left">
            Shorten a URL
          </h2>
          <div className="space-y-1">
            <label htmlFor="url" className="text-xs font-medium text-slate-400">
              Long URL
            </label>
            <input
              id="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com/page"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-violet-500 focus:border-violet-500 focus:ring-1"
              value={longURL}
              onChange={(e) => setLongURL(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="alias"
              className="text-xs font-medium text-slate-400"
            >
              Custom alias (optional)
            </label>
            <input
              id="alias"
              type="text"
              placeholder="my-brand"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="exp"
              className="text-xs font-medium text-slate-400"
            >
              Expires in days (optional, 1–365)
            </label>
            <input
              id="exp"
              type="number"
              min={1}
              max={365}
              placeholder="e.g. 30"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p
              className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white shadow hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Shortening…" : "Shorten"}
          </button>
        </form>

        {resolvedShortUrl && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Your short link
            </p>
            <p className="break-all font-mono text-sm text-violet-300">
              {resolvedShortUrl}
            </p>
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        )}

        <MyLinksPanel />
      </div>
    </div>
  );
}

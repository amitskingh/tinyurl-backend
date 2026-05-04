import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiPrefix } from "../lib/api";

type AliasRow = {
  aliasId: number;
  alias: string | null;
  clickCount: number;
  URLId: number;
  longURL: string;
  expiresAt: string | null;
};

type ListPayload = {
  status: string;
  data: { aliases: AliasRow[] };
};

type AnalyticsPayload = Record<string, unknown>;

export function MyLinksPanel() {
  const { backendUser, getIdToken } = useAuth();
  const [aliases, setAliases] = useState<AliasRow[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [analyticsById, setAnalyticsById] = useState<
    Record<number, AnalyticsPayload | null>
  >({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<number | null>(
    null
  );

  const loadList = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setListErr(null);
    setLoadingList(true);
    try {
      const res = await apiFetch("/api/v1/", { headers: { Accept: "application/json" }, token });
      const json = (await res.json()) as ListPayload & {
        message?: string;
        status?: string;
      };
      if (!res.ok || json.status !== "success" || !json.data?.aliases) {
        throw new Error(json.message || "Could not load links");
      }
      setAliases(json.data.aliases);
    } catch (e) {
      setListErr(e instanceof Error ? e.message : "Failed to load links");
      setAliases(null);
    } finally {
      setLoadingList(false);
    }
  }, [getIdToken]);

  const loadAnalytics = useCallback(
    async (aliasId: number) => {
      const token = await getIdToken();
      if (!token) return;
      setLoadingAnalytics(aliasId);
      try {
        const res = await apiFetch(`/api/v1/analytics/${aliasId}`, {
          token,
        });
        const json = (await res.json()) as AnalyticsPayload & {
          message?: string;
        };
        if (!res.ok) {
          throw new Error(
            (json.message as string) || "Could not load analytics"
          );
        }
        setAnalyticsById((prev) => ({ ...prev, [aliasId]: json }));
      } catch (e) {
        setAnalyticsById((prev) => ({
          ...prev,
          [aliasId]: {
            error: e instanceof Error ? e.message : "Analytics failed",
          },
        }));
      } finally {
        setLoadingAnalytics(null);
      }
    },
    [getIdToken]
  );

  if (!backendUser) {
    return null;
  }

  const origin =
    (typeof import.meta.env.VITE_PUBLIC_ORIGIN === "string" &&
      import.meta.env.VITE_PUBLIC_ORIGIN) ||
    window.location.origin;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-white">Your short links</h2>
        <button
          type="button"
          onClick={() => void loadList()}
          disabled={loadingList}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {loadingList ? "Loading…" : aliases ? "Refresh" : "Load links"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Only links created while signed in are listed (they are tied to your
        account).
      </p>

      {listErr && (
        <p className="text-sm text-red-300" role="alert">
          {listErr}
        </p>
      )}

      {aliases && aliases.length === 0 && (
        <p className="text-sm text-slate-400">No links yet. Shorten one above.</p>
      )}

      {aliases && aliases.length > 0 && (
        <ul className="space-y-3">
          {aliases.map((row) => {
            const shortPath = `${apiPrefix}/api/v1/${encodeURIComponent(row.alias ?? "")}`;
            const shortUrl = `${origin}${shortPath}`;
            const snap = analyticsById[row.aliasId];
            return (
              <li
                key={row.aliasId}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="break-all font-mono text-violet-300">
                      {shortUrl}
                    </p>
                    <p className="break-all text-xs text-slate-500">
                      → {row.longURL}
                    </p>
                    <p className="text-xs text-slate-400">
                      Clicks: {row.clickCount}
                      {row.expiresAt
                        ? ` · Expires ${new Date(row.expiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loadingAnalytics === row.aliasId}
                    onClick={() => void loadAnalytics(row.aliasId)}
                    className="shrink-0 rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loadingAnalytics === row.aliasId
                      ? "…"
                      : snap
                        ? "Refresh stats"
                        : "Analytics"}
                  </button>
                </div>
                {snap && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300">
                    {JSON.stringify(snap, null, 2)}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, apiPrefix } from "../lib/api";

interface AliasRow {
  aliasId: number;
  alias: string | null;
  clickCount: number;
  URLId: number;
  longURL: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ListPayload {
  status: string;
  message?: string;
  data: { aliases: AliasRow[] };
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AnalyticsSuccessPayload {
  aliasId: number;
  totalClicks: number;
  uniqueClicks: number;
  countries: Record<string, number>;
  referrers: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
}

interface AnalyticsErrorPayload {
  error: string;
}

type AnalyticsPayload = AnalyticsSuccessPayload | AnalyticsErrorPayload;

function isAnalyticsError(
  payload: AnalyticsPayload
): payload is AnalyticsErrorPayload {
  return "error" in payload;
}

const secondaryButtonClass =
  "rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-colors duration-150 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";
const badgeClass =
  "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600";

export function MyLinksPanel() {
  const { user } = useAuth();
  const [aliases, setAliases] = useState<AliasRow[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [analyticsById, setAnalyticsById] = useState<
    Record<number, AnalyticsPayload | null>
  >({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    setListErr(null);
    setLoadingList(true);
    try {
      const { data: json } = await api.get<ListPayload>("/api/v1/");
      if (json.status !== "success" || !json.data?.aliases) {
        throw new Error(json.message || "Could not load links");
      }
      setAliases(json.data.aliases);
    } catch (error) {
      setListErr(error instanceof Error ? error.message : "Failed to load links");
      setAliases(null);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (aliasId: number) => {
    setLoadingAnalytics(aliasId);
    try {
      const { data } = await api.get<AnalyticsPayload>(
        `/api/v1/analytics/${aliasId}`
      );
      setAnalyticsById((prev) => ({ ...prev, [aliasId]: data }));
    } catch (error) {
      const response = (error as ErrorResponse).response;
      setAnalyticsById((prev) => ({
        ...prev,
        [aliasId]: {
          error: response?.data?.message || "Analytics failed",
        },
      }));
    } finally {
      setLoadingAnalytics(null);
    }
  }, []);

  const deleteAlias = useCallback(async (aliasId: number) => {
    setListErr(null);
    try {
      await api.delete(`/api/v1/${aliasId}`);
      setAliases((prev) =>
        prev ? prev.filter((alias) => alias.aliasId !== aliasId) : prev
      );
    } catch (error) {
      const response = (error as ErrorResponse).response;
      setListErr(response?.data?.message || "Could not delete link");
    }
  }, []);

  if (!user) {
    return null;
  }

  const origin =
    (typeof import.meta.env.VITE_PUBLIC_ORIGIN === "string" &&
      import.meta.env.VITE_PUBLIC_ORIGIN) ||
    window.location.origin;
  const shortUrlBase = apiPrefix.startsWith("http")
    ? apiPrefix
    : `${origin}${apiPrefix}`;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-colors duration-150 hover:border-gray-300">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Your short links
            </h2>
            <p className="text-sm font-normal leading-relaxed text-gray-400">
              Only links created while signed in are tied to your account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadList()}
            disabled={loadingList}
            className={secondaryButtonClass}
          >
            {loadingList ? "Loading..." : aliases ? "Refresh" : "Load links"}
          </button>
        </div>

        {listErr ? (
          <p
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-normal leading-relaxed text-gray-900"
            role="alert"
          >
            {listErr}
          </p>
        ) : null}

        {aliases && aliases.length === 0 ? (
          <p className="text-sm font-normal leading-relaxed text-gray-400">
            No links yet. Shorten one from the main page.
          </p>
        ) : null}

        {aliases && aliases.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {aliases.map((row) => {
              const shortPath = `${apiPrefix}/api/v1/${encodeURIComponent(
                row.alias ?? ""
              )}`;
              const shortUrl = apiPrefix.startsWith("http")
                ? shortPath
                : `${shortUrlBase}/api/v1/${encodeURIComponent(row.alias ?? "")}`;
              const analytics = analyticsById[row.aliasId];

              return (
                <li
                  key={row.aliasId}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="break-all font-mono text-sm text-gray-900">
                          {shortUrl}
                        </p>
                        <p className="break-all text-sm font-normal leading-relaxed text-gray-400">
                          to {row.longURL}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={badgeClass}>
                            Alias ID {row.aliasId}
                          </span>
                          <span className={badgeClass}>URL ID {row.URLId}</span>
                          <span className={badgeClass}>
                            {row.clickCount} clicks
                          </span>
                          <span className={badgeClass}>
                            Created {new Date(row.createdAt).toLocaleDateString()}
                          </span>
                          {row.expiresAt ? (
                            <span className={badgeClass}>
                              Expires{" "}
                              {new Date(row.expiresAt).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loadingAnalytics === row.aliasId}
                          onClick={() => void loadAnalytics(row.aliasId)}
                          className={secondaryButtonClass}
                        >
                          {loadingAnalytics === row.aliasId
                            ? "Loading..."
                            : analytics
                              ? "Refresh stats"
                              : "Analytics"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteAlias(row.aliasId)}
                          className={secondaryButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {analytics ? (
                      <div className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-900 sm:grid-cols-2">
                        {isAnalyticsError(analytics) ? (
                          <p className="sm:col-span-2">{analytics.error}</p>
                        ) : (
                          <>
                            <p>Alias ID: {analytics.aliasId}</p>
                            <p>Total clicks: {analytics.totalClicks}</p>
                            <p>Unique clicks: {analytics.uniqueClicks}</p>
                            <p>Countries: {Object.keys(analytics.countries).length}</p>
                            <p>Referrers: {Object.keys(analytics.referrers).length}</p>
                            <p>Devices: {Object.keys(analytics.devices).length}</p>
                            <p>Browsers: {Object.keys(analytics.browsers).length}</p>
                            <p>Operating systems: {Object.keys(analytics.os).length}</p>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

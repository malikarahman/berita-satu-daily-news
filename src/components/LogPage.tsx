"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LogEntry = {
  id: string;
  kind: "activity" | "error";
  timestamp: string;
  module: string;
  action: string;
  actor: string;
  articleId: number | null;
  articleTitle: string | null;
  location: string;
  statusOrResult: string;
  message: string;
};

type LogSummary = {
  total: number;
  activity: number;
  error: number;
};

export function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummary>({ total: 0, activity: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: "",
    module: "",
    actor: "",
    location: "",
    result: ""
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/logs${queryString ? `?${queryString}` : ""}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setLogs(payload.logs);
      setSummary(payload.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat log.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Logs" value={String(summary.total)} />
        <SummaryCard label="Activity Logs" value={String(summary.activity)} />
        <SummaryCard label="Error Logs" value={String(summary.error)} tone="text-brand-red" />
      </section>

      <section className="rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
        <div className="grid grid-cols-5 gap-3">
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <input
            value={filters.module}
            onChange={(event) => setFilters((prev) => ({ ...prev, module: event.target.value }))}
            placeholder="Module / action"
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <input
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Article / location"
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <input
            value={filters.actor}
            onChange={(event) => setFilters((prev) => ({ ...prev, actor: event.target.value }))}
            placeholder="Actor"
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
          <input
            value={filters.result}
            onChange={(event) => setFilters((prev) => ({ ...prev, result: event.target.value }))}
            placeholder="Status / result"
            className="h-10 rounded-md border border-newsroom-line px-3 text-sm"
          />
        </div>
        {error ? <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="overflow-hidden rounded-md border border-newsroom-line bg-white shadow-subtle">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-brand-navy/5 text-xs uppercase text-newsroom-muted">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Module / Action</th>
              <th className="px-4 py-3">Article / Location</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Status / Result</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-newsroom-line">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-newsroom-muted">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-newsroom-surface/70">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(log.timestamp))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        log.kind === "error"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-brand-navySoft text-brand-navy"
                      }`}
                    >
                      {log.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-newsroom-ink">{log.module}</div>
                    <div className="mt-1 text-newsroom-muted">{log.action}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-newsroom-ink">{log.articleTitle ?? "-"}</div>
                    <div className="mt-1 text-newsroom-muted">{log.location}</div>
                  </td>
                  <td className="px-4 py-3">{log.actor}</td>
                  <td className="px-4 py-3">{log.statusOrResult}</td>
                  <td className="max-w-[420px] px-4 py-3 text-newsroom-muted">{log.message}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-newsroom-muted">
                  Belum ada log yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone = "text-brand-navy" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
      <div className="text-sm text-newsroom-muted">{label}</div>
      <div className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

// File: app/(protected)/me/page.tsx
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

type DailyRow = {
  dateKey: string;
  entryAt?: string;
  lunchStartAt?: string;
  lunchStopAt?: string;
  exitAt?: string;
  singles: string[];
};

type WindowBlock = {
  window: { label: string; startIso: string; endIso: string };
  dailyCount: number;
  daily: DailyRow[];
};

function useMyDailyReports(page: number, per: number) {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('per', String(per));
  // API already scopes to current user when not ADMIN
  return useQuery({
    queryKey: ['my-biweekly-daily', page, per],
    queryFn: async () => {
      const res = await fetch(`/api/reports/biweekly/list?${qs}`, {
        cache: 'no-store'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load reports');
      return json as { windows: WindowBlock[]; page: number; per: number };
    }
    // keepPreviousData: true
  });
}

export default function MyReportsPage() {
  const [page, setPage] = React.useState(1);
  const [per, setPer] = React.useState(5);
  const { data, isLoading, error } = useMyDailyReports(page, per);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold">My Reports (Daily)</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="space-y-1">
          <span className="text-sm">Windows per page</span>
          <select
            className="rounded border px-3 py-2"
            value={per}
            onChange={(e) => setPer(Number(e.target.value) || 5)}
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <div className="text-sm">Page {page}</div>
          <button
            className="rounded border px-3 py-1"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{(error as any).message}</div>
      ) : (
        <div className="space-y-4">
          {data?.windows.map((w, idx) => (
            <details key={idx} className="rounded border bg-white">
              <summary className="cursor-pointer px-3 py-2 select-none">
                <span className="font-medium">{w.window.label}</span>
                <span className="ml-2 text-sm text-slate-500">
                  ({w.dailyCount} day rows)
                </span>
              </summary>

              <div className="overflow-x-auto px-3 pb-3">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Entry</th>
                      <th className="px-2 py-1 text-left">Lunch Start</th>
                      <th className="px-2 py-1 text-left">Lunch Stop</th>
                      <th className="px-2 py-1 text-left">Exit</th>
                      <th className="px-2 py-1 text-left">Singles/Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.daily.map((r) => (
                      <tr key={`${r.dateKey}`} className="border-b">
                        <td className="px-2 py-1 font-mono text-xs">
                          {r.dateKey}
                        </td>
                        <td className="px-2 py-1">
                          {r.entryAt
                            ? new Date(r.entryAt).toLocaleTimeString()
                            : '—'}
                        </td>
                        <td className="px-2 py-1">
                          {r.lunchStartAt
                            ? new Date(r.lunchStartAt).toLocaleTimeString()
                            : '—'}
                        </td>
                        <td className="px-2 py-1">
                          {r.lunchStopAt
                            ? new Date(r.lunchStopAt).toLocaleTimeString()
                            : '—'}
                        </td>
                        <td className="px-2 py-1">
                          {r.exitAt
                            ? new Date(r.exitAt).toLocaleTimeString()
                            : '—'}
                        </td>
                        <td className="px-2 py-1 text-xs text-slate-600">
                          {r.singles.join(', ') || ''}
                        </td>
                      </tr>
                    ))}
                    {w.daily.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-3 text-center text-slate-500"
                        >
                          No day records in this window
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

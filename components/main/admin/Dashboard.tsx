// app/(protected)/admin/reports/page.tsx
'use client';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

function useReports(page: number, per: number, q: string, email: string) {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('per', String(per));
  if (q) qs.set('q', q);
  if (email) qs.set('email', email);
  return useQuery({
    queryKey: ['biweekly-daily', page, per, q, email],
    queryFn: async () => {
      const res = await fetch(`/api/reports/biweekly/list?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load reports');
      return json as {
        windows: Array<{
          window: { label: string; startIso: string; endIso: string };
          daily: Array<{
            dateKey: string;
            userEmail: string;
            userName?: string | null;
            entryAt?: string;
            lunchStartAt?: string;
            lunchStopAt?: string;
            exitAt?: string;
            singles: string[];
          }>;
          dailyCount: number;
        }>;
      };
    }
    // keepPreviousData: true
  });
}

export default function AdminReportsPage() {
  const [page, setPage] = React.useState(1);
  const [per, setPer] = React.useState(5);
  const [q, setQ] = React.useState('');
  const [email, setEmail] = React.useState('');

  const { data, isLoading, error } = useReports(page, per, q, email);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold">Admin Reports (Daily)</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm">Search (name or email)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm">Filter by exact email</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm">Windows per page</span>
          <select
            className="w-full rounded border px-3 py-2"
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
      </div>

      <div className="flex items-center justify-between">
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
                      <th className="px-2 py-1 text-left">User</th>
                      <th className="px-2 py-1 text-left">Entry</th>
                      <th className="px-2 py-1 text-left">Lunch Start</th>
                      <th className="px-2 py-1 text-left">Lunch Stop</th>
                      <th className="px-2 py-1 text-left">Exit</th>
                      <th className="px-2 py-1 text-left">Singles/Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.daily.map((r) => (
                      <tr
                        key={`${r.userEmail}-${r.dateKey}`}
                        className="border-b"
                      >
                        <td className="px-2 py-1 font-mono text-xs">
                          {r.dateKey}
                        </td>
                        <td className="px-2 py-1">
                          {r.userName || r.userEmail}
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
                          colSpan={7}
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

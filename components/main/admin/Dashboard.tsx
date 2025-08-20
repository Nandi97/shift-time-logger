import React from 'react';
import { requireAdmin } from '@/lib/isAdmin';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly';
import { fetchAggregates } from '@/lib/aggregate';
import Link from 'next/link';
import { formatDateWithWeekday, formatTime12h } from '@/lib/torontoDateFormat';

export const dynamic = 'force-dynamic';
const Dashboard = async ({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) => {
  const { ok, isAdmin } = await requireAdmin();
  if (!ok) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Admin Reports</h1>
        <p className="mt-2 text-red-600">
          You are not authorized to view this page.
        </p>
      </div>
    );
  }

  const { startKey, endKeyExclusive, tz } = currentBiweeklyWindowFromAnchor();
  const start =
    (typeof searchParams?.start === 'string' && searchParams?.start) ||
    startKey;
  const endEx =
    (typeof searchParams?.end === 'string' && searchParams?.end) ||
    endKeyExclusive;

  const rows = await fetchAggregates(start, endEx);

  // Group by user
  const byUser = new Map<
    string,
    { name: string; email: string; days: typeof rows }
  >();
  for (const r of rows) {
    if (!byUser.has(r.userEmail))
      byUser.set(r.userEmail, {
        name: r.userName,
        email: r.userEmail,
        days: [] as any
      });
    byUser.get(r.userEmail)!.days.push(r);
  }
  return (
    <>
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Admin Reports (Bi-weekly)
            </h1>
            <p className="text-sm text-slate-600">
              Period: <b>{start}</b> → <b>{endEx}</b> (exclusive) —{' '}
              <code>{tz}</code>
            </p>
            <p className="text-sm text-slate-600">
              Entries show <b>Entry</b>, optional <b>LunchStart/LunchEnd</b>,
              and <b>Exit</b>. Hours are Entry→Exit (no lunch deduction).
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/api/reports/biweekly?dryRun=1`}
              className="rounded bg-slate-900 px-3 py-2 text-white"
            >
              Preview JSON
            </Link>
            <Link
              href={`/api/admin/export?start=${start}&end=${endEx}`}
              className="rounded bg-blue-600 px-3 py-2 text-white"
            >
              Download CSV
            </Link>
          </div>
        </div>

        {[...byUser.values()].map((u) => (
          <div key={u.email} className="mb-8 overflow-x-auto rounded-lg border">
            <div className="bg-slate-50 px-3 py-2 text-sm font-medium">
              {u.name} — {u.email}
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="px-3 py-2 text-left">Day</th>
                  <th className="px-3 py-2 text-left">Entry</th>
                  <th className="px-3 py-2 text-left">Lunch Start</th>
                  <th className="px-3 py-2 text-left">Lunch End</th>
                  <th className="px-3 py-2 text-left">Exit</th>
                  <th className="px-3 py-2 text-right">Minutes</th>
                  <th className="px-3 py-2 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {u.days.map((d) => (
                  <tr key={d.dayKey} className="border-b">
                    <td className="px-3 py-2">
                      {formatDateWithWeekday(d.dayKey)}
                    </td>
                    <td className="px-3 py-2">
                      {d.entry ? formatTime12h(d.entry.toISOString()) : ''}
                    </td>
                    <td className="px-3 py-2">
                      {d.lunchStart
                        ? formatTime12h(d.lunchStart.toISOString())
                        : ''}
                    </td>
                    <td className="px-3 py-2">
                      {d.lunchEnd
                        ? formatTime12h(d.lunchEnd.toISOString())
                        : ''}
                    </td>
                    <td className="px-3 py-2">
                      {d.exit ? formatTime12h(d.exit.toISOString()) : ''}
                    </td>
                    <td className="px-3 py-2 text-right">{d.minutesTotal}</td>
                    <td className="px-3 py-2 text-right">
                      {(d.minutesTotal / 60).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
};

export default Dashboard;

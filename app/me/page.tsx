import { getSessionOrThrow } from '@/lib/isAdmin';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly';
import { fetchAggregates } from '@/lib/aggregate';

export const dynamic = 'force-dynamic';

export default async function MyTimePage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const session = await getSessionOrThrow();
  const email = session.user!.email!;

  const { startKey, endKeyExclusive, tz } = currentBiweeklyWindowFromAnchor();
  const start =
    (typeof searchParams?.start === 'string' && searchParams?.start) ||
    startKey;
  const endEx =
    (typeof searchParams?.end === 'string' && searchParams?.end) ||
    endKeyExclusive;

  const rows = await fetchAggregates(start, endEx, email);
  const totalMinutes = rows.reduce((acc, r) => acc + r.minutesTotal, 0);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-semibold">My Hours</h1>
      <p className="mb-4 text-sm text-slate-600">
        Period: <b>{start}</b> → <b>{endEx}</b> (exclusive) — <code>{tz}</code>
      </p>

      <div className="mb-4 rounded-lg border bg-slate-50 p-3 text-sm">
        <div>
          Total minutes: <b>{totalMinutes}</b>
        </div>
        <div>
          Total hours: <b>{(totalMinutes / 60).toFixed(2)}</b>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
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
            {rows.map((d) => (
              <tr key={d.dayKey} className="border-b">
                <td className="px-3 py-2">{d.dayKey}</td>
                <td className="px-3 py-2">
                  {d.entry ? d.entry.toISOString() : ''}
                </td>
                <td className="px-3 py-2">
                  {d.lunchStart ? d.lunchStart.toISOString() : ''}
                </td>
                <td className="px-3 py-2">
                  {d.lunchEnd ? d.lunchEnd.toISOString() : ''}
                </td>
                <td className="px-3 py-2">
                  {d.exit ? d.exit.toISOString() : ''}
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
    </div>
  );
}

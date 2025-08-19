import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/isAdmin';
import { fetchAggregates } from '@/lib/aggregate';

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  if (!start || !end)
    return NextResponse.json({ error: 'Missing start/end' }, { status: 400 });

  const rows = await fetchAggregates(start, end);

  const header = [
    'User',
    'Email',
    'Day',
    'Entry(UTC)',
    'LunchStart(UTC)',
    'LunchEnd(UTC)',
    'Exit(UTC)',
    'Minutes',
    'Hours'
  ];
  const lines = [header.join(',')];

  for (const r of rows) {
    const csv = [
      r.userName,
      r.userEmail,
      r.dayKey,
      r.entry ? r.entry.toISOString() : '',
      r.lunchStart ? r.lunchStart.toISOString() : '',
      r.lunchEnd ? r.lunchEnd.toISOString() : '',
      r.exit ? r.exit.toISOString() : '',
      String(r.minutesTotal),
      (r.minutesTotal / 60).toFixed(2)
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
    lines.push(csv);
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=export_${start}_${end}.csv`
    }
  });
}

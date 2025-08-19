import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly'; // make sure this exists (we shared earlier)
import { sendMail } from '@/services/mailer'; // <- your Gmail-based mailer

type Totals = { name: string; email: string; minutes: number; days: number };
type DetailRow = [string, string, string, string, string, string]; // Name, Email, Day, Entry(UTC), Exit(UTC), Minutes

function minutesDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}
function q(s: unknown) {
  return `"${(s ?? '').toString().replace(/"/g, '""')}"`;
}
function toCsv(lines: string[][]) {
  return lines.map((l) => l.map(q).join(',')).join('\n');
}

export async function POST(req: NextRequest) {
  // Guard (so only you/cron can hit it)
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // inside POST(req)
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as any;

  // Optionally allow dry-runs (no email) via body: { dryRun: true }
  // const body = (await req.json().catch(() => ({}))) as Partial<{
  //   dryRun: boolean;
  //   toEmail: string;
  // }>;
  const dryRun = Boolean(body.dryRun);

  // allow ?force=1 OR { "force": true } to bypass parity
  const force = url.searchParams.get('force') === '1' || body.force === true;

  // Compute pay window (Sunday 00:00 → Sunday 00:00 EXCLUSIVE), anchored to your cycle
  // app/api/reports/biweekly/route.ts (inside POST)
  const { startKey, endKeyExclusive, tz, cycles } =
    currentBiweeklyWindowFromAnchor();

  // skip only if NOT forced
  if (!force && process.env.BIWEEKLY_PARITY) {
    const wantOdd = process.env.BIWEEKLY_PARITY === 'odd';
    const isOdd = cycles % 2 === 1;
    const shouldSkip = wantOdd ? !isOdd : isOdd; // skip opposite parity
    if (shouldSkip) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'off-week',
        cycles,
        hint: 'Add ?force=1 or {force:true} to override for testing.'
      });
    }
  }

  // Only send on odd (or even) cycles to make it bi-weekly.
  // Flip this condition if you want the “other” Sundays.
  if (
    process.env.BIWEEKLY_PARITY === 'odd' ? cycles % 2 === 0 : cycles % 2 === 1
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'off-week',
      cycles
    });
  }

  // Fetch logs for window
  const logs = await prisma.workLog.findMany({
    where: { dayKey: { gte: startKey, lt: endKeyExclusive } },
    orderBy: [{ userEmail: 'asc' }, { dayKey: 'asc' }, { timestamp: 'asc' }],
    select: {
      userEmail: true,
      userName: true,
      dayKey: true,
      action: true,
      timestamp: true
    }
  });

  // Pair Entry↔Exit per user/day
  const perDay = new Map<
    string,
    { name: string; email: string; day: string; entry?: Date; exit?: Date }
  >(); // key: email|dayKey

  for (const l of logs) {
    const key = `${l.userEmail}|${l.dayKey}`;
    if (!perDay.has(key)) {
      perDay.set(key, {
        name: l.userName || l.userEmail,
        email: l.userEmail,
        day: l.dayKey
      });
    }
    const row = perDay.get(key)!;
    if (l.action === 'Entry' && !row.entry) row.entry = l.timestamp;
    if (l.action === 'Exit' && !row.exit) row.exit = l.timestamp;
  }

  // Aggregate totals + build detail rows
  const totals = new Map<string, Totals>();
  const details: DetailRow[] = [
    ['User', 'Email', 'Day', 'Entry (UTC)', 'Exit (UTC)', 'Minutes']
  ];

  for (const [, r] of perDay) {
    const mins = r.entry && r.exit ? minutesDiff(r.entry, r.exit) : 0;
    details.push([
      r.name,
      r.email,
      r.day,
      r.entry ? r.entry.toISOString() : '',
      r.exit ? r.exit.toISOString() : '',
      String(mins)
    ]);

    const t = totals.get(r.email) || {
      name: r.name,
      email: r.email,
      minutes: 0,
      days: 0
    };
    t.minutes += mins;
    t.days += 1;
    totals.set(r.email, t);
  }

  // Summary for email + CSV
  const summaryRows = Array.from(totals.values()).map((t) => ({
    name: t.name,
    email: t.email,
    hours: (t.minutes / 60).toFixed(2),
    minutes: String(t.minutes),
    days: String(t.days)
  }));

  const summaryCsv: string[][] = [
    ['User', 'Email', 'Total Hours', 'Total Minutes', 'Days']
  ];
  for (const r of summaryRows)
    summaryCsv.push([r.name, r.email, r.hours, r.minutes, r.days]);

  const csvSummary = toCsv(summaryCsv);
  const csvDetails = toCsv(details);

  // Simple HTML email (we can switch to React Email later)
  const subject = `Bi-weekly Hours (Sun–Sat) ${startKey} → ${endKeyExclusive}`;
  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
      <h2>Bi-weekly Hours</h2>
      <p>Period: <strong>${startKey}</strong> (Sun 00:00) → <strong>${endKeyExclusive}</strong> (Sun 00:00, exclusive) — ${tz}</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">User</th>
            <th align="left">Email</th>
            <th align="center">Total Hours</th>
            <th align="center">Total Minutes</th>
            <th align="center">Days</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows
            .map(
              (r) =>
                `<tr>
                  <td>${r.name}</td>
                  <td>${r.email}</td>
                  <td align="center">${r.hours}</td>
                  <td align="center">${r.minutes}</td>
                  <td align="center">${r.days}</td>
                </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <p>Attachments: Summary.csv & Details.csv</p>
    </div>
  `;

  // Send (or dry-run)
  if (!dryRun) {
    await sendMail({
      toEmail: body.toEmail ?? process.env.REPORT_RECIPIENT_EMAIL!,
      subject,
      htmlContent,
      optText: `Bi-weekly report ${startKey} -> ${endKeyExclusive} (${tz})`,
      attachments: [
        {
          filename: `summary_${startKey}_${endKeyExclusive}.csv`,
          content: csvSummary
        },
        {
          filename: `details_${startKey}_${endKeyExclusive}.csv`,
          content: csvDetails
        }
      ]
    });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    subject,
    period: { startKey, endKeyExclusive, tz },
    users: totals.size,
    summaryCount: summaryRows.length,
    detailCount: Math.max(0, details.length - 1)
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 });
}

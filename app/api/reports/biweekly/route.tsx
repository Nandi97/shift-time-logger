import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly'; // make sure this exists (we shared earlier)
import { sendMail } from '@/services/mailer'; // <- your Gmail-based mailer
import { BiWeeklyReportEmail } from '@/components/emails/BiWeeklyReportEmail';
import { render } from '@react-email/components';

// ----------------- small helpers -----------------
type Totals = { name: string; email: string; minutes: number; days: number };
type DetailRow = [string, string, string, string, string, string];

const TZ = 'America/Toronto';

const isSundayLocal = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    timeZone: TZ
  });
  return fmt.format(new Date()) === 'Sun';
};

const minutesDiff = (a: Date, b: Date) =>
  Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));

const csvQuote = (s: unknown) =>
  `"${(s ?? '').toString().replace(/"/g, '""')}"`;
const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map(csvQuote).join(',')).join('\n');

// ----------------- POST handler -----------------

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const reqUrl = new URL(req.url);
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  // parse flags
  const body = (await req.json().catch(() => ({}))) as Partial<{
    force: boolean;
    dryRun: boolean;
    toEmail: string;
  }>;
  const force = reqUrl.searchParams.get('force') === '1' || body.force === true;
  const dryRun =
    reqUrl.searchParams.get('dryRun') === '1' || body.dryRun === true;

  // auth
  // Guard (so only you/cron can hit it)
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // schedule guards
  const sunday = isSundayLocal();
  if (!force && !sunday) {
    console.info('[biweekly][skip] not Sunday (local)', { ip, sunday });
    return NextResponse.json({ ok: true, skipped: true, reason: 'not Sunday' });
  }

  // compute pay window & cycle
  const { startKey, endKeyExclusive, tz, cycles } =
    currentBiweeklyWindowFromAnchor();
  const wantOdd = process.env.BIWEEKLY_PARITY === 'odd'; // optional parity control
  const isOdd = cycles % 2 === 1;
  const shouldSkip =
    !force && !!process.env.BIWEEKLY_PARITY && (wantOdd ? !isOdd : isOdd);

  console.log('=== [biweekly] trigger ===', {
    atUtc: new Date().toISOString(),
    ip,
    force,
    dryRun,
    sunday,
    cycles,
    parity: process.env.BIWEEKLY_PARITY || 'none',
    shouldSkip,
    window: `${startKey} → ${endKeyExclusive} (${tz})`
  });

  if (shouldSkip) {
    console.warn('[biweekly][skip] off-week by parity', {
      cycles,
      wantOdd,
      isOdd
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'off-week',
      cycles
    });
  }

  // fetch logs for window
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

  console.info('[biweekly][data] fetched logs', { count: logs.length });

  // pair Entry ↔ Exit per user/day
  const perDay = new Map<
    string,
    { name: string; email: string; day: string; entry?: Date; exit?: Date }
  >();
  for (const l of logs) {
    const k = `${l.userEmail}|${l.dayKey}`;
    if (!perDay.has(k))
      perDay.set(k, {
        name: l.userName || l.userEmail,
        email: l.userEmail,
        day: l.dayKey
      });
    const row = perDay.get(k)!;
    if (l.action === 'Entry' && !row.entry) row.entry = l.timestamp;
    if (l.action === 'Exit' && !row.exit) row.exit = l.timestamp;
  }

  // aggregate
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

  const summaryRows = Array.from(totals.values()).map((t) => ({
    name: t.name,
    email: t.email,
    hours: (t.minutes / 60).toFixed(2),
    minutes: String(t.minutes),
    days: String(t.days)
  }));

  console.info('[biweekly][aggregate]', {
    users: totals.size,
    days: Math.max(0, details.length - 1),
    example: summaryRows[0] || null
  });

  // render React Email → HTML
  const htmlContent = await render(
    <BiWeeklyReportEmail
      startKey={startKey}
      endKeyExclusive={endKeyExclusive}
      tz={tz}
      summaryRows={summaryRows}
    />
  );

  // CSVs
  const summaryCsvRows: string[][] = [
    ['User', 'Email', 'Total Hours', 'Total Minutes', 'Days']
  ];
  for (const r of summaryRows)
    summaryCsvRows.push([r.name, r.email, r.hours, r.minutes, r.days]);
  const csvSummary = toCsv(summaryCsvRows);
  const csvDetails = toCsv(details);

  const subject = `Bi-weekly Hours (Sun–Sat) ${startKey} → ${endKeyExclusive}`;

  if (dryRun) {
    console.info('[biweekly][dry-run] not sending email', {
      subject,
      to: process.env.REPORT_RECIPIENT_EMAIL,
      summaryCsvBytes: Buffer.byteLength(csvSummary, 'utf8'),
      detailsCsvBytes: Buffer.byteLength(csvDetails, 'utf8')
    });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      period: { startKey, endKeyExclusive, tz, cycles },
      users: totals.size,
      rows: logs.length,
      elapsedMs: Date.now() - startedAt
    });
  }

  // send via your Gmail mailer
  try {
    await sendMail({
      toEmail: process.env.REPORT_RECIPIENT_EMAIL!,
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
    console.info('[biweekly][mail] sent', {
      to: process.env.REPORT_RECIPIENT_EMAIL,
      subject
    });
  } catch (err: any) {
    console.error('[biweekly][mail][error]', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    return NextResponse.json(
      { ok: false, error: 'Email send failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    period: { startKey, endKeyExclusive, tz, cycles },
    users: totals.size,
    rows: logs.length,
    elapsedMs: Date.now() - startedAt
  });
}

// Optional GET
export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly';
import { sendMail } from '@/lib/mailer';
import { BiWeeklyReportEmail } from '@/components/emails/BiWeeklyReportEmail';
import { format } from 'date-fns';

function minutesDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}
function toCsv(lines: string[][]) {
  return lines
    .map((l) =>
      l.map((x) => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { startKey, endKeyExclusive } = currentBiweeklyWindowFromAnchor();

  const logs = await prisma.workLog.findMany({
    where: { dayKey: { gte: startKey, lt: endKeyExclusive } },
    orderBy: [{ userEmail: 'asc' }, { dayKey: 'asc' }, { timestamp: 'asc' }]
  });

  // Pair Entry/Exit
  const summaryMap = new Map<
    string,
    { name: string; email: string; minutes: number; days: number }
  >();
  const details: string[][] = [
    ['User', 'Email', 'Day', 'Entry', 'Exit', 'Minutes']
  ];

  for (const log of logs) {
    const key = `${log.userEmail}|${log.dayKey}`;
    if (!summaryMap.has(log.userEmail)) {
      summaryMap.set(log.userEmail, {
        name: log.userName || log.userEmail,
        email: log.userEmail,
        minutes: 0,
        days: 0
      });
    }
    const existing = details.find(
      (r) => r[1] === log.userEmail && r[2] === log.dayKey
    );
    if (!existing) {
      details.push([
        log.userName || log.userEmail,
        log.userEmail,
        log.dayKey,
        '',
        '',
        ''
      ]);
    }
    const rowIndex = details.findIndex(
      (r) => r[1] === log.userEmail && r[2] === log.dayKey
    );
    if (log.action === 'Entry')
      details[rowIndex][3] = format(log.timestamp, 'yyyy-MM-dd HH:mm:ss');
    if (log.action === 'Exit') {
      details[rowIndex][4] = format(log.timestamp, 'yyyy-MM-dd HH:mm:ss');
      if (details[rowIndex][3]) {
        const mins = minutesDiff(new Date(details[rowIndex][3]), log.timestamp);
        details[rowIndex][5] = String(mins);
        const sum = summaryMap.get(log.userEmail)!;
        sum.minutes += mins;
        sum.days += 1;
      }
    }
  }

  const summaryRows = Array.from(summaryMap.values()).map((s) => ({
    name: s.name,
    email: s.email,
    hours: (s.minutes / 60).toFixed(2),
    minutes: String(s.minutes),
    days: String(s.days)
  }));

  const csvSummary = toCsv([
    ['Name', 'Email', 'Hours', 'Minutes', 'Days'],
    ...summaryRows.map((r) => [r.name, r.email, r.hours, r.minutes, r.days])
  ]);
  const csvDetails = toCsv(details);

  const messageId = await sendMail({
    to: process.env.REPORT_RECIPIENT_EMAIL!,
    subject: `Bi-weekly Hours ${startKey} → ${endKeyExclusive}`,
    reactBody: BiWeeklyReportEmail({ startKey, endKeyExclusive, summaryRows }),
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

  return NextResponse.json({ message: 'Report sent', messageId });
}

import { prisma } from '@/lib/prisma';

export type DayAggregate = {
  userEmail: string;
  userName: string;
  dayKey: string; // YYYY-MM-DD
  entry?: Date;
  lunchStart?: Date;
  lunchEnd?: Date;
  exit?: Date;
  minutesTotal: number; // Entry->Exit (no lunch deduction per requirement)
};

export async function fetchAggregates(
  startKey: string,
  endKeyExclusive: string,
  userEmail?: string
) {
  const where: any = { dayKey: { gte: startKey, lt: endKeyExclusive } };
  if (userEmail) where.userEmail = userEmail;

  const logs = await prisma.workLog.findMany({
    where,
    orderBy: [{ userEmail: 'asc' }, { dayKey: 'asc' }, { timestamp: 'asc' }],
    select: {
      userEmail: true,
      userName: true,
      dayKey: true,
      action: true,
      timestamp: true
    }
  });

  const byKey = new Map<string, DayAggregate>();

  for (const l of logs) {
    const k = `${l.userEmail}|${l.dayKey}`;
    if (!byKey.has(k))
      byKey.set(k, {
        userEmail: l.userEmail,
        userName: l.userName || l.userEmail,
        dayKey: l.dayKey,
        minutesTotal: 0
      });
    const row = byKey.get(k)!;
    if (l.action === 'Entry' && !row.entry) row.entry = l.timestamp;
    if (l.action === 'LunchStart' && !row.lunchStart)
      row.lunchStart = l.timestamp;
    if (l.action === 'LunchEnd' && !row.lunchEnd) row.lunchEnd = l.timestamp;
    if (l.action === 'Exit' && !row.exit) row.exit = l.timestamp;
  }

  for (const [, r] of byKey) {
    if (r.entry && r.exit) {
      r.minutesTotal = Math.max(
        0,
        Math.round((r.exit.getTime() - r.entry.getTime()) / 60000)
      );
    } else {
      r.minutesTotal = 0;
    }
  }

  return Array.from(byKey.values());
}

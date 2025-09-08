// app/api/reports/biweekly/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { biweeklyWindowsPage } from '@/lib/biweekly';
import { aggregateLogsToDaily } from '@/lib/aggregate';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const per = Math.min(
    10,
    Math.max(1, Number(url.searchParams.get('per') || 5))
  );
  const q = url.searchParams.get('q')?.trim()?.toLowerCase() || '';
  const forEmail = url.searchParams.get('email')?.trim()?.toLowerCase() || '';
  const isAdmin = session.user?.role === 'ADMIN';

  const windows = biweeklyWindowsPage(page, per);

  const results = await Promise.all(
    windows.map(async (w) => {
      const whereBase: any = { clientTime: { gte: w.startUtc, lt: w.endUtc } };
      if (!isAdmin) {
        whereBase.userEmail = session.user?.email ?? '__none__';
      } else if (forEmail) {
        whereBase.userEmail = forEmail;
      }

      const logs = await prisma.workLog.findMany({
        where: whereBase,
        orderBy: [{ clientTime: 'asc' }],
        select: {
          id: true,
          userEmail: true,
          userName: true,
          action: true,
          clientTime: true,
          latitude: true,
          longitude: true,
          accuracyMeters: true
        }
      });

      // Optional admin-side text filter by email/name
      const filtered =
        isAdmin && q
          ? logs.filter(
              (r) =>
                (r.userEmail?.toLowerCase() || '').includes(q) ||
                (r.userName?.toLowerCase() || '').includes(q)
            )
          : logs;

      const daily = aggregateLogsToDaily(filtered as any);

      return {
        window: {
          label: w.label,
          startIso: w.startUtc.toISOString(),
          endIso: w.endUtc.toISOString()
        },
        dailyCount: daily.length,
        daily // <-- per-day rows w/ entry/lunch/exit
      };
    })
  );

  return NextResponse.json({ ok: true, page, per, isAdmin, windows: results });
}

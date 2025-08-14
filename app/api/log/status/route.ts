import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Status = {
  hasEntry: boolean;
  hasLunchStart: boolean;
  hasLunchEnd: boolean;
  hasExit: boolean;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Please sign in' }, { status: 401 });
  }

  const { dayKey } = (await req.json()) as { dayKey?: string };
  if (!dayKey) {
    return NextResponse.json({ message: 'Missing dayKey' }, { status: 400 });
  }

  const logs = await prisma.workLog.findMany({
    where: { userEmail: session.user.email, dayKey },
    select: { action: true }
  });

  const status: Status = {
    hasEntry: logs.some((l) => l.action === 'Entry'),
    hasLunchStart: logs.some((l) => l.action === 'LunchStart'),
    hasLunchEnd: logs.some((l) => l.action === 'LunchEnd'),
    hasExit: logs.some((l) => l.action === 'Exit')
  };

  return NextResponse.json(status);
}

export async function GET() {
  return NextResponse.json({ message: 'POST { dayKey } to get status' });
}

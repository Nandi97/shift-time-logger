// app/api/reports/debug/route.ts
import { NextResponse } from 'next/server';
import { currentBiweeklyWindowFromAnchor } from '@/lib/biweekly';

export async function GET() {
  const { startKey, endKeyExclusive, tz, cycles } =
    currentBiweeklyWindowFromAnchor();
  return NextResponse.json({
    nowUtc: new Date().toISOString(),
    window: { startKey, endKeyExclusive, tz },
    cycles,
    parityEnv: process.env.BIWEEKLY_PARITY || 'unset',
    recommend: cycles % 2 === 1 ? 'BIWEEKLY_PARITY=odd' : 'BIWEEKLY_PARITY=even'
  });
}

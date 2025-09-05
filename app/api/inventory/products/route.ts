import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const {
    name,
    sku,
    brand,
    category,
    barcodeUnit,
    barcodePack,
    packSize = 0,
    trackExpiry = false,
    imageUrl = '',
    notes = ''
  } = body || {};

  console.log(body);

  return NextResponse.json({ ok: true, body });
}

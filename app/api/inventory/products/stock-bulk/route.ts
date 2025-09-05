// app/api/inventory/stock-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { items } = (await req.json().catch(() => ({}))) as {
    items: { productId: string; locationId: string }[];
  };
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  // Group by product/location to minimize queries
  const res: { productId: string; locationId: string; onHand: number }[] = [];
  for (const { productId, locationId } of items) {
    const [inSum, outSum] = await Promise.all([
      prisma.inventoryTxn.aggregate({
        where: { productId, toLocationId: locationId },
        _sum: { qtyUnits: true }
      }),
      prisma.inventoryTxn.aggregate({
        where: { productId, fromLocationId: locationId },
        _sum: { qtyUnits: true }
      })
    ]);
    res.push({
      productId,
      locationId,
      onHand: (inSum._sum.qtyUnits || 0) - (outSum._sum.qtyUnits || 0)
    });
  }

  return NextResponse.json({ ok: true, stock: res });
}

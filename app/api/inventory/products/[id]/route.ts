import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const p = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      sku: true,
      notes: true,
      imageUrl: true,
      barcodeUnit: true,
      barcodePack: true,
      packSize: true,
      trackExpiry: true,
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } }
    }
  });
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, product: p });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  if (!name || !sku)
    return NextResponse.json({ error: 'Missing name/sku' }, { status: 400 });

  // Collisions (excluding current product)
  const exists = await prisma.product.findFirst({
    where: {
      AND: [{ id: { not: params.id } }],
      OR: [
        { sku },
        ...(barcodeUnit ? [{ barcodeUnit }] : []),
        ...(barcodePack ? [{ barcodePack }] : [])
      ]
    },
    select: { id: true }
  });
  if (exists)
    return NextResponse.json(
      { error: 'SKU/Barcode already in use' },
      { status: 409 }
    );

  let brandId: string | undefined;
  if (brand) {
    const b = await prisma.brand.upsert({
      where: { name: brand },
      create: { name: brand },
      update: {},
      select: { id: true }
    });
    brandId = b.id;
  }
  let categoryId: string | undefined;
  if (category) {
    const c = await prisma.category.upsert({
      where: { name: category },
      create: { name: category },
      update: {},
      select: { id: true }
    });
    categoryId = c.id;
  }

  const p = await prisma.product.update({
    where: { id: params.id },
    data: {
      name,
      sku,
      brandId: brandId ?? null,
      categoryId: categoryId ?? null,
      barcodeUnit: barcodeUnit || null,
      barcodePack: barcodePack || null,
      packSize: packSize > 0 ? Number(packSize) : null,
      trackExpiry: !!trackExpiry,
      imageUrl: imageUrl || null,
      notes: notes || null
    },
    select: { id: true }
  });

  return NextResponse.json({ ok: true, id: p.id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional: block delete if txns exist
  const count = await prisma.inventoryTxn.count({
    where: { productId: params.id }
  });
  if (count > 0) {
    return NextResponse.json(
      { error: 'Cannot delete: transactions exist' },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

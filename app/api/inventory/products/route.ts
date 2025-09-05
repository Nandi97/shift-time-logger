// app/api/inventory/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Destructure + normalize
  let {
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
  } = body ?? {};

  // Basic validation + trimming
  name = typeof name === 'string' ? name.trim() : '';
  sku = typeof sku === 'string' ? sku.trim() : '';
  brand = typeof brand === 'string' ? brand.trim() : '';
  category = typeof category === 'string' ? category.trim() : '';
  barcodeUnit = typeof barcodeUnit === 'string' ? barcodeUnit.trim() : '';
  barcodePack = typeof barcodePack === 'string' ? barcodePack.trim() : '';
  imageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  notes = typeof notes === 'string' ? notes.trim() : '';
  const packSizeNum = Number(packSize) || 0;
  const trackExpiryBool = Boolean(trackExpiry);

  if (!name || !sku) {
    return NextResponse.json(
      { error: 'Missing required fields: name, sku' },
      { status: 400 }
    );
  }

  // Collision checks (SKU / barcodes must be unique if provided)
  const collision = await prisma.product.findFirst({
    where: {
      OR: [
        { sku },
        ...(barcodeUnit ? ([{ barcodeUnit }] as const) : []),
        ...(barcodePack ? ([{ barcodePack }] as const) : [])
      ]
    },
    select: { id: true, sku: true, barcodeUnit: true, barcodePack: true }
  });

  if (collision) {
    return NextResponse.json(
      { error: 'SKU or barcode already exists' },
      { status: 409 }
    );
  }

  // Upsert brand/category if provided
  let brandId: string | null = null;
  if (brand) {
    const b = await prisma.brand.upsert({
      where: { name: brand },
      create: { name: brand },
      update: {},
      select: { id: true }
    });
    brandId = b.id;
  }

  let categoryId: string | null = null;
  if (category) {
    const c = await prisma.category.upsert({
      where: { name: category },
      create: { name: category },
      update: {},
      select: { id: true }
    });
    categoryId = c.id;
  }

  // Create product
  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        brandId,
        categoryId,
        barcodeUnit: barcodeUnit || null,
        barcodePack: barcodePack || null,
        packSize: packSizeNum > 0 ? packSizeNum : null,
        trackExpiry: trackExpiryBool,
        imageUrl: imageUrl || null,
        notes: notes || null
      },
      select: {
        id: true,
        name: true,
        sku: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        barcodeUnit: true,
        barcodePack: true,
        packSize: true,
        trackExpiry: true,
        imageUrl: true,
        notes: true,
        createdAt: true
      }
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err: any) {
    // Handle unique constraint races, etc.
    console.error('[products:POST] error creating product', {
      message: err?.message,
      code: err?.code
    });
    // Prisma P2002 = Unique constraint failed on the {constraint}
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint failed (SKU/barcode already in use)' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || '';

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { barcodeUnit: q },
            { barcodePack: q }
          ]
        }
      : {},
    orderBy: { name: 'asc' },
    take: 50, // cap results to prevent heavy loads
    select: {
      id: true,
      name: true,
      sku: true,
      imageUrl: true,
      barcodeUnit: true,
      barcodePack: true,
      packSize: true
    }
  });

  return NextResponse.json({ ok: true, products });
}

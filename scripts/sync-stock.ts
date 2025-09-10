import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, LocationType } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Where to read the workbook from:
// - local path (absolute or relative)
// - or a URL (HTTP/S)
const SOURCE = process.env.STOCK_XLSX_PATH || process.env.STOCK_XLSX_URL;

type Row = {
  'Product Name': string;
  SKU: string;
  Brand?: string;
  Category?: string;
  'Barcode (Unit)'?: string;
  'Barcode (Pack)'?: string;
  'Pack Size'?: number | string;
  'Track Expiry (Yes/No)'?: string;
  'Image URL (if any)'?: string;
  'Image URL'?: string; // if you used the alternate header
  Notes?: string;
  'Initial Quantity'?: number | string;
  'Location Code (e.g., WH, OUT-QUEEN, ONLINE)': string;
};

async function fetchBuffer(src: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${src}`);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } else {
    const abs = path.isAbsolute(src) ? src : path.join(process.cwd(), src);
    return await fs.readFile(abs);
  }
}

async function ensureLocation(code: string) {
  return prisma.location.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: code,
      type: code === 'WH' ? LocationType.WAREHOUSE : LocationType.OUTLET
    },
    select: { id: true, code: true }
  });
}

async function getOnHand(productId: string, locationId: string) {
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
  return (inSum._sum.qtyUnits || 0) - (outSum._sum.qtyUnits || 0);
}

async function main() {
  if (!SOURCE) throw new Error('Set STOCK_XLSX_PATH or STOCK_XLSX_URL');

  const buf = await fetchBuffer(SOURCE);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { raw: false, defval: '' });

  // normalize and group by SKU+Location
  for (const raw of rows) {
    const name = String(raw['Product Name'] || '').trim();
    const sku = String(raw['SKU'] || '').trim();
    const brandName = String(raw['Brand'] || '').trim();
    const categoryName = String(raw['Category'] || '').trim();
    const barcodeUnit = String(raw['Barcode (Unit)'] || '').trim() || undefined;
    const barcodePack = String(raw['Barcode (Pack)'] || '').trim() || undefined;
    const packSize = Number(raw['Pack Size'] || 0) || 0;
    const trackExpiry = String(raw['Track Expiry (Yes/No)'] || '')
      .toLowerCase()
      .startsWith('y');
    const imageUrl =
      String(raw['Image URL (if any)'] || raw['Image URL'] || '').trim() ||
      undefined;
    const notes = String(raw['Notes'] || '').trim() || undefined;
    const qty = Number(raw['Initial Quantity'] || 0) || 0;
    const locationCode = String(
      raw['Location Code (e.g., WH, OUT-QUEEN, ONLINE)'] || ''
    ).trim();

    if (!name || !sku || !locationCode) {
      console.warn(`Skipping row (missing name/sku/location):`, raw);
      continue;
    }

    // brand/category
    let brandId: string | null = null;
    if (brandName) {
      const b = await prisma.brand.upsert({
        where: { name: brandName },
        update: {},
        create: { name: brandName },
        select: { id: true }
      });
      brandId = b.id;
    }

    let categoryId: string | null = null;
    if (categoryName) {
      const c = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
        select: { id: true }
      });
      categoryId = c.id;
    }

    // product (upsert by SKU)
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        brandId,
        categoryId,
        barcodeUnit: barcodeUnit ?? null,
        barcodePack: barcodePack ?? null,
        packSize: packSize > 0 ? packSize : null,
        trackExpiry,
        imageUrl: imageUrl ?? null,
        notes: notes ?? null
      },
      create: {
        name,
        sku,
        brandId,
        categoryId,
        barcodeUnit: barcodeUnit ?? null,
        barcodePack: barcodePack ?? null,
        packSize: packSize > 0 ? packSize : null,
        trackExpiry,
        imageUrl: imageUrl ?? null,
        notes: notes ?? null
      },
      select: { id: true, name: true, sku: true }
    });

    // location
    const loc = await ensureLocation(locationCode);

    // set stock to qty by issuing an ADJUSTMENT delta
    const current = await getOnHand(product.id, loc.id);
    const delta = qty - current;
    if (delta !== 0) {
      await prisma.inventoryTxn.create({
        data: {
          productId: product.id,
          fromLocationId: delta < 0 ? loc.id : null,
          toLocationId: delta > 0 ? loc.id : null,
          qtyUnits: Math.abs(delta),
          type: 'ADJUSTMENT',
          reason: 'Sync from Excel'
        }
      });
      console.log(
        `[SET] ${product.sku} @ ${loc.code}: ${current} → ${qty} (Δ ${delta > 0 ? '+' : '-'}${Math.abs(delta)})`
      );
    } else {
      console.log(`[OK ] ${product.sku} @ ${loc.code}: already ${qty}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

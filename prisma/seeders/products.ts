// prisma/seed/products.ts
import { prisma, withStep } from './utils';

export async function seedProducts() {
  await withStep('Products', async () => {
    // Helper to resolve brand/category IDs by name
    const brandId = async (name: string) =>
      (await prisma.brand.findUnique({ where: { name }, select: { id: true } }))
        ?.id ?? null;
    const categoryId = async (name: string) =>
      (
        await prisma.category.findUnique({
          where: { name },
          select: { id: true }
        })
      )?.id ?? null;

    const items = [
      {
        name: 'Aloe Soothing Gel',
        sku: 'DRS-ALOE-100',
        brand: 'Dr Sante',
        category: 'Skincare',
        barcodeUnit: '0123456789012',
        barcodePack: '0999999999999',
        packSize: 6,
        trackExpiry: true,
        imageUrl: '',
        notes: 'Popular soothing gel'
      },
      {
        name: 'Hard Wax Beads 1kg',
        sku: 'TNZ-WAX-1KG',
        brand: 'Tenzerro',
        category: 'Waxing',
        barcodeUnit: '2233445566778',
        barcodePack: null,
        packSize: null,
        trackExpiry: false,
        imageUrl: '',
        notes: null
      }
    ];

    for (const i of items) {
      const bId = i.brand ? await brandId(i.brand) : null;
      const cId = i.category ? await categoryId(i.category) : null;

      await prisma.product.upsert({
        where: { sku: i.sku },
        update: {
          name: i.name,
          brandId: bId,
          categoryId: cId,
          barcodeUnit: i.barcodeUnit,
          barcodePack: i.barcodePack,
          packSize: i.packSize,
          trackExpiry: i.trackExpiry,
          imageUrl: i.imageUrl,
          notes: i.notes
        },
        create: {
          name: i.name,
          sku: i.sku,
          brandId: bId,
          categoryId: cId,
          barcodeUnit: i.barcodeUnit,
          barcodePack: i.barcodePack,
          packSize: i.packSize,
          trackExpiry: i.trackExpiry,
          imageUrl: i.imageUrl,
          notes: i.notes
        }
      });
    }
  });
}

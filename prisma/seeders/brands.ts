// prisma/seed/brands.ts
import { prisma, withStep } from './utils';

export async function seedBrands() {
  await withStep('Brands', async () => {
    const names = ['Dr Sante', 'Tenzerro'];
    for (const name of names) {
      await prisma.brand.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
  });
}

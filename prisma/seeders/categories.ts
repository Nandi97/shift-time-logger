// prisma/seed/categories.ts
import { prisma, withStep } from './utils';

export async function seedCategories() {
  await withStep('Categories', async () => {
    const names = ['Waxing', 'Skincare', 'Hair', 'Consumables'];
    for (const name of names) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
  });
}

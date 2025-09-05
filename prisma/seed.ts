import { prisma } from '@/lib/prisma';
import { logTitle } from './seeders/utils';
import { seedLocations } from './seeders/locations';
import { seedBrands } from './seeders/brands';
import { seedCategories } from './seeders/categories';
import { seedProducts } from './seeders/products';

async function main() {
  logTitle('Seeding start');

  // Order matters (FKs):
  await seedLocations();
  await seedBrands();
  await seedCategories();
  await seedProducts();

  logTitle('Seeding complete');
}

main().catch((error) => {
  console.error('Unhandled error in seeder:', error);
  process.exit(1);
});

// prisma/seed/locations.ts
import { LocationType } from '@prisma/client';
import { prisma, withStep } from './utils';

export async function seedLocations() {
  await withStep('Locations', async () => {
    await prisma.location.upsert({
      where: { code: 'WH' },
      update: {},
      create: { code: 'WH', name: 'Warehouse', type: LocationType.WAREHOUSE }
    });

    await prisma.location.upsert({
      where: { code: 'OUT-QUEEN' },
      update: {},
      create: {
        code: 'OUT-QUEEN',
        name: 'Outlet - Queen St',
        type: LocationType.OUTLET
      }
    });

    await prisma.location.upsert({
      where: { code: 'ONLINE' },
      update: {},
      create: { code: 'ONLINE', name: 'Online', type: LocationType.ONLINE }
    });
  });
}

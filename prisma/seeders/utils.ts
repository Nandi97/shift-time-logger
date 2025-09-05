// prisma/seed/utils.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function withStep(name: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  process.stdout.write(`→ ${name}… `);
  await fn();
  const ms = Date.now() - t0;
  console.log(`done (${ms}ms)`);
}

export function logTitle(title: string) {
  console.log(`\n=== ${title} ===`);
}

// Handy wrapper to upsert by a unique field
export async function upsertUnique<T extends keyof typeof prisma>(
  model: T,
  where: any,
  create: any,
  update = {}
) {
  // @ts-ignore
  return prisma[model].upsert({ where, create, update });
}

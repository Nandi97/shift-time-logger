/**
 * Simple admin check: compare the signed-in email to ADMIN_EMAILS (comma-separated)
 * Example: ADMIN_EMAILS="boss@org.com, hr@org.com"
 */
// lib/isAdmin.ts
import { auth } from '@/auth';

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const byRole = session?.user?.role === 'ADMIN';

  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const byEnv = email ? envAdmins.includes(email) : false;

  return { ok: byRole || byEnv, isAdmin: byRole || byEnv, session };
}

export async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  return session;
}

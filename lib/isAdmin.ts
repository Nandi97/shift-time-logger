import { auth } from '@/auth';

/**
 * Simple admin check: compare the signed-in email to ADMIN_EMAILS (comma-separated)
 * Example: ADMIN_EMAILS="boss@org.com, hr@org.com"
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email)
    return { ok: false as const, session, isAdmin: false };
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = allow.includes(session.user.email.toLowerCase());
  return { ok: isAdmin as const, session, isAdmin };
}

export async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  return session;
}

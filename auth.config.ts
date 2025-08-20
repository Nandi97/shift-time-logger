import { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Github from 'next-auth/providers/github';

import 'next-auth/jwt';

const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Github({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
      authorization: { params: { scope: 'read:user user:email' } }
      /**
       * (Optional) profile map runs ONLY on first sign-in if you want to
       * set defaults at creation time. Since the Prisma schema already
       * defaults role to USER, we can omit or keep this for clarity.
       */
    })
  ],
  pages: {
    signIn: '/' //sigin page
  },
  // basePath: "/auth",
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname === '/middleware-example') return !!auth;
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // On initial sign-in, `user` comes from DB (via adapter) and includes role.
      if (user) {
        // Persist role into the JWT
        token.role = (user as any).role ?? 'USER';

        // If you want provider access tokens:
        if (account?.access_token) token.accessToken = account.access_token;
      }

      // Allow explicit role update if you ever call `signIn('credentials', { ... })`
      // or `useSession().update({ user: { role: ... } })`
      if (trigger === 'update' && session?.user?.role) {
        token.role = session.user.role as 'USER' | 'ADMIN';
      }

      return token;
    },
    async session({ session, token }) {
      // keep your existing accessToken behavior
      if (token?.accessToken) session.accessToken = token.accessToken as string;

      // expose role on the session
      if (session.user) {
        session.user.role = (token.role as 'USER' | 'ADMIN') ?? 'USER';
      }
      return session;
    }
  },
  experimental: { enableWebAuthn: true }
} satisfies NextAuthConfig;

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'USER' | 'ADMIN'; // <— add role on Session
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: 'USER' | 'ADMIN'; // <— add role on JWT
  }
}

export default authConfig;

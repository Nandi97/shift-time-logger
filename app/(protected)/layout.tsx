import React from 'react';
import { auth } from '@/auth';
import Link from 'next/link';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Please sign in</h1>
        <p className="text-slate-600">You must be signed in to continue.</p>
        <div className="mt-4">
          <Link href="/" className="rounded bg-blue-600 px-4 py-2 text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">
            Ops Suite
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/clock" className="hover:underline">
              Time
            </Link>
            <Link href="/inventory" className="hover:underline">
              Inventory
            </Link>
            <span className="text-slate-500">{session.user?.email}</span>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';
import { auth } from '@/auth';

const page = async () => {
  const session = await auth();
  return (
    <PageContainer scrollable={false}>
      <h1 className="mb-2 text-2xl font-semibold">
        Dashboard{session?.user?.name ? `, ${session.user.name}` : ''}
      </h1>
      <p className="mb-6 text-slate-600">Choose an applet to begin.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/clock"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Time Entry</div>
          <p className="text-sm text-slate-600">
            Entry/Lunch/Exit with geofence + NFC.
          </p>
        </Link>

        <Link
          href="/inventory"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Inventory</div>
          <p className="text-sm text-slate-600">
            Scan, move stock, returns, write-offs.
          </p>
        </Link>

        {session?.user?.role === 'ADMIN' && (
          <Link
            href="/admin/reports"
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 text-lg font-medium">Reports (Admin)</div>
            <p className="text-sm text-slate-600">
              Bi-weekly hours & inventory exports.
            </p>
          </Link>
        )}
      </div>
    </PageContainer>
  );
};

export default page;

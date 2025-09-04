import Link from 'next/link';
import { auth } from '@/auth';

export default async function Landing() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        Welcome{session?.user?.name ? `, ${session.user.name}` : ''}
      </h1>
      <p className="mb-6 text-slate-600">Choose an applet to begin.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/clock"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Time Entry</div>
          <p className="text-sm text-slate-600">
            Tap NFC or log Entry/Lunch/Exit. Geofenced.
          </p>
        </Link>
        <Link
          href="/inventory"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Inventory</div>
          <p className="text-sm text-slate-600">
            Scan items, transfer to outlets, record practice/returns.
          </p>
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Reports (Admin)</div>
          <p className="text-sm text-slate-600">
            Biweekly hours, inventory movements, exports.
          </p>
        </Link>
      </div>
    </div>
  );
}

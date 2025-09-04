import Link from 'next/link';

export default function InventoryHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <p className="text-slate-600">Quick actions</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/inventory/scan"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Scan & Move</div>
          <p className="text-sm text-slate-600">
            Use a barcode scanner (USB) or keyboard.
          </p>
        </Link>
        <Link
          href="/inventory/products"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Products</div>
          <p className="text-sm text-slate-600">
            Search, stock by location, print labels.
          </p>
        </Link>
        <Link
          href="/inventory/movements"
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 text-lg font-medium">Movements</div>
          <p className="text-sm text-slate-600">
            History, filters, CSV export.
          </p>
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ScannerInput } from '../ScannerInput';

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const ProductsView = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = React.useState(sp.get('q') || '');
  const [view, setView] = React.useState<'grid' | 'table'>(
    (sp.get('view') as 'grid' | 'table') || 'grid'
  );
  const dq = useDebounced(q, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', dq],
    queryFn: async () => {
      const url = dq
        ? `/api/inventory/products?q=${encodeURIComponent(dq)}`
        : '/api/inventory/products';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch');
      return json.products as Array<{
        id: string;
        name: string;
        sku: string;
        imageUrl?: string | null;
        barcodeUnit?: string | null;
        barcodePack?: string | null;
        packSize?: number | null;
      }>;
    },
    staleTime: 10_000
  });

  // keep URL in sync (for sharable filters)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (view !== 'grid') params.set('view', view);
    const s = params.toString();
    router.replace(`/inventory/products${s ? `?${s}` : ''}`);
  }, [q, view, router]);

  async function onScan(code: string) {
    // Try exact lookup by barcode/sku
    const res = await fetch(
      `/api/inventory/products?q=${encodeURIComponent(code)}`
    );
    const json = await res.json();
    if (res.ok && Array.isArray(json.products)) {
      // Prefer exact match by barcodeUnit/barcodePack/sku
      const exact = json.products.find((p: any) =>
        [p.barcodeUnit, p.barcodePack, p.sku].includes(code)
      );
      const target = exact || json.products[0];
      if (target) {
        router.push(`/inventory/products/${target.id}/edit`);
        return;
      }
    }
    // Nothing found → go to create with prefilled barcodeUnit
    router.push(
      `/inventory/products/new?barcodeUnit=${encodeURIComponent(code)}`
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Name, SKU, or scan a barcode…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded border bg-white p-1">
            <button
              onClick={() => setView('grid')}
              className={`rounded px-3 py-1 text-sm ${view === 'grid' ? 'bg-slate-900 text-white' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView('table')}
              className={`rounded px-3 py-1 text-sm ${view === 'table' ? 'bg-slate-900 text-white' : ''}`}
            >
              Table
            </button>
          </div>
          <Link
            href="/inventory/products/new"
            className="rounded bg-blue-600 px-3 py-2 text-white"
          >
            New Product
          </Link>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <div className="mb-2 text-sm font-medium text-slate-600">Scanner</div>
        <ScannerInput
          onScan={onScan}
          placeholder="Scan a barcode (press Enter)"
        />
      </div>
      {isLoading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{(error as any).message}</div>
      ) : !data || data.length === 0 ? (
        <div className="text-sm text-slate-600">No products found.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              href={`/inventory/products/${p.id}/edit`}
              className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-slate-100">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-slate-500">
                  SKU: {p.sku}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {p.barcodeUnit && <span>U:{p.barcodeUnit}</span>}
                  {p.barcodePack && (
                    <span className="ml-2">P:{p.barcodePack}</span>
                  )}
                  {typeof p.packSize === 'number' && p.packSize > 0 && (
                    <span className="ml-2">x{p.packSize}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-3 py-2 text-left">Image</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Unit Barcode</th>
                <th className="px-3 py-2 text-left">Pack Barcode</th>
                <th className="px-3 py-2 text-right">Pack Size</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2">
                    <div className="h-10 w-10 overflow-hidden rounded border bg-slate-100">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.barcodeUnit || ''}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.barcodePack || ''}
                  </td>
                  <td className="px-3 py-2 text-right">{p.packSize ?? ''}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/inventory/products/${p.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductsView;

'use client';
import React from 'react';
import { ScannerInput } from '@/components/main/ScannerInput';

const PRESETS = [
  { id: 'DELIVER', label: 'Deliver to Outlet' },
  { id: 'RECEIVE', label: 'Receive (Restock)' },
  { id: 'PRACTICE', label: 'Practice / Internal Use' },
  { id: 'RETURN', label: 'Return from Outlet' },
  { id: 'WRITE_OFF', label: 'Write-off (Expired/Damaged)' }
];
const page = () => {
  const [logs, setLogs] = React.useState<string[]>([]);
  const [preset, setPreset] = React.useState<string>('DELIVER');
  const [qty, setQty] = React.useState<number>(1);
  const [outlet, setOutlet] = React.useState<string>('');

  async function postScan(code: string) {
    const payload: any = { code, qty, preset, outletId: outlet || undefined };
    setLogs((l) =>
      [
        `${new Date().toLocaleTimeString()} • ${preset} • x${qty} • ${code}${outlet ? ` → ${outlet}` : ''}`,
        ...l
      ].slice(0, 20)
    );

    try {
      const res = await fetch('/api/inventory/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Scan failed');
      setLogs((l) =>
        [
          `✅ OK • ${data.product?.name || code} • ${data.deltaUnits} units moved • OnHand@${data.location?.code}: ${data.onHand}`,
          ...l
        ].slice(0, 20)
      );
    } catch (e: any) {
      setLogs((l) => [`❌ ${e.message}`, ...l].slice(0, 20));
    }
  }
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Scan & Move</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Preset</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Quantity</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Outlet (optional for Deliver/Return)
          </label>
          <input
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            placeholder="OUT-QUEEN, OUT-YONGE..."
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <ScannerInput onScan={postScan} />

      <div className="rounded-lg border bg-white p-3">
        <div className="mb-2 text-sm font-medium text-slate-600">Recent</div>
        <ul className="space-y-1 text-sm">
          {logs.map((x, i) => (
            <li key={i} className="font-mono">
              {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default page;

'use client';
import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';

export default function ClockPage() {
  const { data: session, status } = useSession();
  const [geo, setGeo] = useState<{ lat?: number; lon?: number; acc?: number }>(
    {}
  );
  const [msg, setMsg] = useState('');

  // auto-get geolocation once user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGeo({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: pos.coords.accuracy
          }),
        () => setGeo({})
      );
    }
  }, [status]);

  // React Query mutation to send the log request
  const logMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clientTime: new Date().toISOString(),
          lat: geo.lat,
          lon: geo.lon,
          acc: geo.acc
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    },
    onSuccess: (data) => setMsg(data.message || 'Recorded'),
    onError: (err: any) => setMsg(err.message || 'Error')
  });

  if (status === 'loading') return <div className="p-4">Loading…</div>;

  // Not signed in yet
  if (status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-md p-4">
        <h1 className="mb-2 text-xl font-bold">Time Logger</h1>
        <p className="mb-4">Sign in with GitHub to continue.</p>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => signIn('github')}
        >
          Sign in
        </button>
      </div>
    );
  }

  const geoReady = Boolean(geo.lat && geo.lon);
  const disabled = logMutation.isPending || !geoReady;

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Time Logger</h1>
        <div className="text-right text-sm">
          <div>{session.user?.name || 'GitHub User'}</div>
          <div className="text-gray-500">{session.user?.email}</div>
        </div>
      </div>

      <div className="mb-3 text-sm">
        {geoReady ? (
          <div>
            On-site check • lat {geo.lat!.toFixed(5)}, lon {geo.lon!.toFixed(5)}{' '}
            (±{Math.round(geo.acc || 0)}m)
          </div>
        ) : (
          <div>
            Enable location services to clock in/out. On-site geolocation is
            required.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded bg-green-600 px-4 py-2 text-white"
          disabled={disabled}
          onClick={() => logMutation.mutate('Entry')}
        >
          Entry
        </button>
        <button
          className="rounded bg-red-600 px-4 py-2 text-white"
          disabled={disabled}
          onClick={() => logMutation.mutate('Exit')}
        >
          Exit
        </button>
        <button
          className="rounded bg-yellow-500 px-4 py-2 text-white"
          disabled={disabled}
          onClick={() => logMutation.mutate('LunchStart')}
        >
          Lunch Start
        </button>
        <button
          className="rounded bg-yellow-700 px-4 py-2 text-white"
          disabled={disabled}
          onClick={() => logMutation.mutate('LunchEnd')}
        >
          Lunch End
        </button>
      </div>

      {msg && <p className="mt-4 text-blue-700">{msg}</p>}

      <button className="mt-6 text-sm underline" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}

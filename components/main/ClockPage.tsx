'use client';
import { useEffect, useMemo, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Haversine distance in meters
function toRad(v: number) {
  return (v * Math.PI) / 180;
}
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build a day key from the user's local calendar day
function getLocalDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Status = {
  hasEntry: boolean;
  hasLunchStart: boolean;
  hasLunchEnd: boolean;
  hasExit: boolean;
};

type Geo = { lat?: number; lon?: number; acc?: number };

export default function ClockPage() {
  const { data: session, status: authStatus } = useSession();

  // Geolocation state
  const [geo, setGeo] = useState<Geo>({});
  const [geoErr, setGeoErr] = useState<string | null>(null);

  // Button state & messages
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  // Read client-exposed env
  const site = useMemo(() => {
    const lat = parseFloat(process.env.NEXT_PUBLIC_WORK_SITE_LAT || '');
    const lon = parseFloat(process.env.NEXT_PUBLIC_WORK_SITE_LON || '');
    const fence = parseFloat(process.env.NEXT_PUBLIC_GEOFENCE_METERS || '0');
    const minAcc = parseFloat(
      process.env.NEXT_PUBLIC_MIN_ACCURACY_METERS || '0'
    );
    return { lat, lon, fence, minAcc };
  }, []);

  // Compute client-side withinFence + distance + accuracy flag (UX-only)
  const { distanceMeters, withinFence, accuracyOk, ready } = useMemo(() => {
    const ready = typeof geo.lat === 'number' && typeof geo.lon === 'number';
    if (
      !ready ||
      Number.isNaN(site.lat) ||
      Number.isNaN(site.lon) ||
      Number.isNaN(site.fence)
    ) {
      return {
        distanceMeters: undefined as number | undefined,
        withinFence: false,
        accuracyOk: false,
        ready
      };
    }
    const d = haversine(geo.lat!, geo.lon!, site.lat, site.lon);
    const accOk = !site.minAcc || !geo.acc || geo.acc <= site.minAcc;
    return {
      distanceMeters: d,
      withinFence: site.fence > 0 ? d <= site.fence : true,
      accuracyOk: accOk,
      ready
    };
  }, [geo, site]);

  const dayKey = useMemo(() => getLocalDayKey(), []);

  // Fetch one-time geolocation when authenticated
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    if (!('geolocation' in navigator)) {
      setGeoErr('Geolocation not supported on this device.');
      return;
    }

    setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc: pos.coords.accuracy
        });
      },
      (err) => {
        setGeo({});
        setGeoErr(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable location to clock.'
            : 'Unable to get location. Move to an open area and retry.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [authStatus]);

  // Load today's status (what buttons should be enabled) after sign-in
  useEffect(() => {
    const loadStatus = async () => {
      if (authStatus !== 'authenticated') return;
      try {
        const res = await fetch('/api/log/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayKey })
        });
        if (!res.ok) {
          // Not fatal, but show the server message if present
          const data = await res.json().catch(() => ({}));
          console.log('Status Data', data);
          setMsg(data?.message || 'Failed to load status.');
          return;
        }
        const data = (await res.json()) as Status;
        setStatus(data);
      } catch {
        setMsg('Network error while loading status.');
      }
    };
    loadStatus();
  }, [authStatus, dayKey]);

  async function submit(action: 'Entry' | 'Exit' | 'LunchStart' | 'LunchEnd') {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clientTime: new Date().toISOString(),
          lat: typeof geo.lat === 'number' ? geo.lat : undefined,
          lon: typeof geo.lon === 'number' ? geo.lon : undefined,
          acc: typeof geo.acc === 'number' ? geo.acc : undefined,
          dayKey
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.message || 'Failed to record.');
      } else {
        setMsg(data?.message || 'Recorded.');
        if (data?.next) setStatus(data.next as Status);
      }
    } catch {
      setMsg('Network error while recording.');
    } finally {
      setLoading(false);
    }
  }

  if (authStatus === 'loading') {
    return <div className="p-4">Loading…</div>;
  }

  if (authStatus !== 'authenticated') {
    return (
      <div className="mx-auto max-w-md p-4">
        <h1 className="mb-2 text-xl font-bold">Time Logger</h1>
        <p className="mb-4">Sign in to continue.</p>
        <Button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => signIn('github')}
        >
          Sign in
        </Button>
      </div>
    );
  }

  // Disable buttons if:
  // - No geolocation yet
  // - Accuracy too poor (if you set a min)
  // - Outside the fence
  // Disable logic (client gate). Server still enforces.
  const disabledCommon =
    loading || !ready || !accuracyOk || withinFence === false;

  const disableEntry = disabledCommon || Boolean(status?.hasEntry);
  const disableLunchStart =
    disabledCommon || !status?.hasEntry || Boolean(status?.hasLunchStart);
  const disableLunchEnd =
    disabledCommon || !status?.hasLunchStart || Boolean(status?.hasLunchEnd);
  const disableExit =
    disabledCommon || !status?.hasEntry || Boolean(status?.hasExit);

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Time Logger</h1>
        <div className="flex items-center">
          <div className="rounded-full border-2 border-pink-400">
            <Avatar>
              {session?.user?.image ? (
                <AvatarImage src={session.user.image as string} />
              ) : (
                <AvatarFallback>
                  {session?.user?.name
                    ? session.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : '?'}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="text-right text-sm">
            <div>{session?.user?.name || 'User'}</div>
            <div className="text-gray-500">{session.user?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Geofence status */}
      <div className="mb-3 text-sm">
        {geoErr ? (
          <div className="text-red-600">{geoErr}</div>
        ) : ready ? (
          <div>
            <div>
              Location • lat {geo.lat!.toFixed(5)}, lon {geo.lon!.toFixed(5)} (±
              {Math.round(geo.acc || 0)}m)
            </div>
            {typeof distanceMeters === 'number' && site.fence > 0 && (
              <div>
                Distance to site: ~{Math.round(distanceMeters)} m (allowed ≤{' '}
                {Math.round(site.fence)} m)
              </div>
            )}
            {!accuracyOk && (
              <div className="text-amber-600">
                Accuracy too low. Move near a window/open area.
              </div>
            )}
            {withinFence === false && (
              <div className="text-red-600">
                You are outside the allowed geofence. Buttons are disabled.
              </div>
            )}
          </div>
        ) : (
          <div>Fetching your location…</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={disableEntry}
          onClick={() => submit('Entry')}
        >
          Entry
        </Button>

        <Button
          className="rounded bg-yellow-500 px-4 py-2 text-white disabled:opacity-50"
          disabled={disableLunchStart}
          onClick={() => submit('LunchStart')}
        >
          Lunch Start
        </Button>
        <Button
          className="rounded bg-yellow-700 px-4 py-2 text-white disabled:opacity-50"
          disabled={disableLunchEnd}
          onClick={() => submit('LunchEnd')}
        >
          Lunch End
        </Button>
        <Button
          className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={disableExit}
          onClick={() => submit('Exit')}
        >
          Exit
        </Button>
      </div>

      {msg && <p className="mt-4 text-blue-700">{msg}</p>}

      <Button className="mt-6 text-sm underline" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toUTCFromToronto } from '@/lib/localtime';

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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Please sign in' }, { status: 401 });
  }

  const body = await req.json();
  const localDate = new Date(body.clientTime);
  const { action, clientTime, lat, lon, acc, dayKey } = body as {
    action?: 'Entry' | 'Exit' | 'LunchStart' | 'LunchEnd';
    clientTime?: string;
    lat?: number;
    lon?: number;
    acc?: number;
    dayKey?: string; // e.g., "2025-08-13" — client local day
  };

  if (!action)
    return NextResponse.json({ message: 'Missing action' }, { status: 400 });
  if (!dayKey)
    return NextResponse.json({ message: 'Missing dayKey' }, { status: 400 });

  // --- Geofence config & checks ---
  const siteLat = parseFloat(process.env.WORK_SITE_LAT || '');
  const siteLon = parseFloat(process.env.WORK_SITE_LON || '');
  const fence = parseFloat(process.env.GEOFENCE_METERS || '0');
  const minAcc = parseFloat(process.env.MIN_ACCURACY_METERS || '0');

  if (Number.isNaN(siteLat) || Number.isNaN(siteLon) || Number.isNaN(fence)) {
    return NextResponse.json(
      { message: 'Server misconfigured geofence' },
      { status: 500 }
    );
  }

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return NextResponse.json(
      { message: 'Geolocation required. Enable location and try again.' },
      { status: 400 }
    );
  }

  if (minAcc > 0 && typeof acc === 'number' && acc > minAcc) {
    return NextResponse.json(
      {
        message: `Location accuracy too low (±${Math.round(acc)} m). Move to an open area, ensure Precise Location is on, then retry.`
      },
      { status: 400 }
    );
  }

  const distanceMeters = haversine(lat, lon, siteLat, siteLon);
  const withinGeofence = fence > 0 ? distanceMeters <= fence : true;
  if (!withinGeofence) {
    return NextResponse.json(
      {
        message: `Outside geofence (~${Math.round(distanceMeters)} m). You must be on-site to clock.`
      },
      { status: 403 }
    );
  }

  // --- Button gating: fetch today's status for this user ---
  const todays = await prisma.workLog.findMany({
    where: { userEmail: session.user.email, dayKey },
    select: { action: true }
  });
  const hasEntry = todays.some((l) => l.action === 'Entry');
  const hasLunchStart = todays.some((l) => l.action === 'LunchStart');
  const hasLunchEnd = todays.some((l) => l.action === 'LunchEnd');
  const hasExit = todays.some((l) => l.action === 'Exit');

  // Enforce order and prevent duplicates
  if (action === 'Entry' && hasEntry) {
    return NextResponse.json(
      { message: 'Entry already recorded for today.' },
      { status: 409 }
    );
  }
  if (action === 'LunchStart') {
    if (!hasEntry) {
      return NextResponse.json(
        { message: 'You must record Entry before starting lunch.' },
        { status: 409 }
      );
    }
    if (hasLunchStart) {
      return NextResponse.json(
        { message: 'Lunch already started today.' },
        { status: 409 }
      );
    }
  }
  if (action === 'LunchEnd') {
    if (!hasLunchStart) {
      return NextResponse.json(
        { message: 'You must start lunch before ending it.' },
        { status: 409 }
      );
    }
    if (hasLunchEnd) {
      return NextResponse.json(
        { message: 'Lunch already ended today.' },
        { status: 409 }
      );
    }
  }
  if (action === 'Exit') {
    if (!hasEntry) {
      return NextResponse.json(
        { message: 'You must record Entry before Exit.' },
        { status: 409 }
      );
    }
    if (hasExit) {
      return NextResponse.json(
        { message: 'Exit already recorded for today.' },
        { status: 409 }
      );
    }
  }

  // Convert to UTC before writing to DB
  const utcDate = toUTCFromToronto(localDate);

  // Meta
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
  const ip =
    forwardedFor.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;

  // Persist
  const log = await prisma.workLog.create({
    data: {
      userEmail: session.user.email!,
      userName: session.user.name || session.user.email || 'User',
      action,
      clientTime: utcDate ? new Date(utcDate) : undefined,
      latitude: lat,
      longitude: lon,
      accuracyMeters: acc,
      distanceMeters,
      withinGeofence,
      userAgent,
      ip: typeof ip === 'string' ? ip : undefined,
      dayKey
    }
  });

  // Return next-state flags so the UI can disable buttons immediately
  const next = {
    hasEntry: hasEntry || action === 'Entry',
    hasLunchStart: hasLunchStart || action === 'LunchStart',
    hasLunchEnd: hasLunchEnd || action === 'LunchEnd',
    hasExit: hasExit || action === 'Exit'
  };

  return NextResponse.json({
    message: `${action} recorded`,
    logId: log.id,
    distanceMeters: Math.round(distanceMeters),
    withinGeofence,
    next
  });
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to send logs' });
}

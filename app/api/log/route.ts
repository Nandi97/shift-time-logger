import type { NextApiRequest, NextApiResponse } from 'next';
// import { getServerSession } from '';
// import { authOptions } from '';
import { prisma } from '@/lib/prisma';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email)
    return res.status(401).json({ message: 'Unauthorized' });

  const { action, clientTime, lat, lon, acc } = req.body as {
    action: string;
    clientTime?: string;
    lat?: number;
    lon?: number;
    acc?: number;
  };
  if (!action) return res.status(400).json({ message: 'Missing action' });

  const siteLat = parseFloat(process.env.WORK_SITE_LAT || '');
  const siteLon = parseFloat(process.env.WORK_SITE_LON || '');
  const fence = parseFloat(process.env.GEOFENCE_METERS || '0');

  if (Number.isNaN(siteLat) || Number.isNaN(siteLon)) {
    return res
      .status(500)
      .json({ message: 'Server misconfigured: site lat/lon not set' });
  }
  if (!(lat && lon)) {
    return res.status(400).json({
      message: 'Geolocation required. Enable location and try again.'
    });
  }

  const minAcc = parseFloat(process.env.MIN_ACCURACY_METERS || '0');
  if (minAcc > 0 && acc && acc > minAcc) {
    return res.status(400).json({
      message: `Location accuracy too low (±${Math.round(acc)}m). Move to an open area and retry.`
    });
  }

  const distanceMeters = haversine(lat, lon, siteLat, siteLon);
  if (fence > 0 && distanceMeters > fence) {
    return res.status(403).json({
      message: `Outside geofence (≈${Math.round(distanceMeters)} m). You must be on-site to clock.`
    });
  }

  const ua = req.headers['user-agent'] || undefined;
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;

  await prisma.workLog.create({
    data: {
      userEmail: session.user.email!,
      userName: session.user.name || session.user.email!,
      action,
      clientTime: clientTime ? new Date(clientTime) : undefined,
      latitude: lat,
      longitude: lon,
      accuracyMeters: acc,
      distanceMeters,
      withinGeofence: true,
      userAgent: ua,
      ip: typeof ip === 'string' ? ip : undefined
    }
  });

  return res.status(200).json({
    message: `${action} recorded for ${session.user.name || session.user.email}`
  });
}

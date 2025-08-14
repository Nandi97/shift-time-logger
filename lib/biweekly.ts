// lib/biweekly.ts
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, format } from 'date-fns';

const TZ = 'America/Toronto';

// Anchor is Sunday of a known pay cycle start
const ANCHOR_START_LOCAL = new Date('2025-07-27T00:00:00'); // local Toronto time

export function currentBiweeklyWindowFromAnchor() {
  const nowUtc = new Date();
  const nowLocal = toZonedTime(nowUtc, TZ);

  // Calculate how many days since anchor
  const daysSinceAnchor = differenceInCalendarDays(
    nowLocal,
    ANCHOR_START_LOCAL
  );
  const cycles = Math.floor(daysSinceAnchor / 14);

  // Start/end in local time
  const startLocal = addDays(ANCHOR_START_LOCAL, cycles * 14);
  const endLocal = addDays(startLocal, 14);

  // Convert to UTC for DB queries
  const startUtc = fromZonedTime(startLocal, TZ);
  const endUtc = fromZonedTime(endLocal, TZ);

  // Human-friendly keys for CSV and filtering
  const startKey = format(startLocal, 'yyyy-MM-dd');
  const endKeyExclusive = format(endLocal, 'yyyy-MM-dd');

  return { startUtc, endUtc, startKey, endKeyExclusive, tz: TZ };
}

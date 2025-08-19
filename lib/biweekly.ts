// lib/biweekly.ts
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, format } from 'date-fns';

const TZ = 'America/Toronto';
const ANCHOR_START_LOCAL = new Date(
  (process.env.ANCHOR_START_LOCAL ?? '2025-07-27') + 'T00:00:00'
);

export function currentBiweeklyWindowFromAnchor() {
  const nowUtc = new Date();
  const nowLocal = toZonedTime(nowUtc, TZ);
  const daysSinceAnchor = differenceInCalendarDays(
    nowLocal,
    ANCHOR_START_LOCAL
  );
  const cycles = Math.floor(daysSinceAnchor / 14); // <— expose this if you like

  const startLocal = addDays(ANCHOR_START_LOCAL, cycles * 14);
  const endExclusiveLocal = addDays(startLocal, 14);

  const startUtc = fromZonedTime(startLocal, TZ);
  const endUtc = fromZonedTime(endExclusiveLocal, TZ);

  const startKey = format(startLocal, 'yyyy-MM-dd');
  const endKeyExclusive = format(endExclusiveLocal, 'yyyy-MM-dd');

  return { startUtc, endUtc, startKey, endKeyExclusive, tz: TZ, cycles };
}

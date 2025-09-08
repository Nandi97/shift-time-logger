// lib/biweekly.ts
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  addDays,
  format,
  startOfDay,
  differenceInCalendarDays
} from 'date-fns';

const TORONTO_TZ = 'America/Toronto';
const ANCHOR_START_LOCAL = new Date(
  (process.env.ANCHOR_START_LOCAL ?? '2025-07-27') + 'T00:00:00'
);

export function currentBiweeklyWindowFromAnchor() {
  const anchorLocal = ANCHOR_START_LOCAL;
  const now = new Date();
  const diffDays = differenceInCalendarDays(
    startOfDay(now),
    startOfDay(anchorLocal)
  );
  const cycles = Math.floor(diffDays / 14); // number of full 14-day windows since anchor
  const startLocal = addDays(anchorLocal, cycles * 14);
  const endLocal = addDays(startLocal, 14); // exclusive
  const startUtc = fromZonedTime(startLocal, TORONTO_TZ);
  const endUtc = fromZonedTime(endLocal, TORONTO_TZ);
  const startKey = startLocal.toISOString().slice(0, 10);
  const endKeyExclusive = endLocal.toISOString().slice(0, 10);
  return {
    tz: TORONTO_TZ,
    anchorLocal,
    startLocal,
    endLocal,
    startUtc,
    endUtc,
    startKey,
    endKeyExclusive,
    cycles
  };
}

/**
 * Return a page of windows going backwards in time.
 * page=1 => current window, page=2 => previous, etc.
 * per = number of windows per page (default 5)
 */
export function biweeklyWindowsPage(page = 1, per = 5) {
  const { anchorLocal } = currentBiweeklyWindowFromAnchor();
  const windows = Array.from({ length: per }).map((_, i) => {
    const offsetCycles = (page - 1) * per + i; // 0-based offset from current window
    const startLocal = addDays(
      anchorLocal,
      (Math.floor(
        differenceInCalendarDays(
          startOfDay(new Date()),
          startOfDay(anchorLocal)
        ) / 14
      ) -
        offsetCycles) *
        14
    );
    const endLocal = addDays(startLocal, 14);
    const startUtc = fromZonedTime(startLocal, TORONTO_TZ);
    const endUtc = fromZonedTime(endLocal, TORONTO_TZ);
    const label = `${startLocal.toISOString().slice(0, 10)} → ${endLocal.toISOString().slice(0, 10)}`;
    return {
      startLocal,
      endLocal,
      startUtc,
      endUtc,
      label,
      startKey: startLocal.toISOString().slice(0, 10)
    };
  });
  return windows;
}

// utils/torontoDateFormat.ts
import { formatInTimeZone } from 'date-fns-tz';
import type { Locale } from 'date-fns';

type Input = Date | string | number;

const TORONTO_TZ = 'America/Toronto';

/** Core helper: format any UTC input in Toronto time with a date-fns pattern */
export function formatToronto(
  input: Input,
  pattern: string,
  options?: { locale?: Locale }
) {
  return formatInTimeZone(input, TORONTO_TZ, pattern, options);
}

/** "19 April 2025 (Tuesday)" */
export function formatDateWithWeekday(
  input: Input,
  opts?: { locale?: Locale }
) {
  return formatToronto(input, 'd LLLL yyyy (EEEE)', opts);
}

/** "8:00 pm" */
export function formatTime12h(input: Input, opts?: { locale?: Locale }) {
  // date-fns 'a' returns AM/PM. Lowercase to match "pm".
  return formatToronto(input, 'h:mm a', opts).toLowerCase();
}

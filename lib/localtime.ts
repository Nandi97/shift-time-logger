import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const TORONTO_TZ = 'America/Toronto';

export function toUTCFromToronto(localDate: Date) {
  return fromZonedTime(localDate, TORONTO_TZ);
}

export function fromUTCToToronto(utcDate: Date) {
  return toZonedTime(utcDate, TORONTO_TZ);
}

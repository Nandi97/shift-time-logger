// lib/aggregateDaily.ts
type RawLog = {
  id: string;
  userEmail: string | null;
  userName: string | null;
  action: string; // ENTRY | EXIT | LUNCH_START | LUNCH_END (case-insensitive variants ok)
  clientTime: string | Date;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
};

export type DailyRow = {
  dateKey: string; // YYYY-MM-DD (Toronto local)
  userEmail: string;
  userName?: string | null;
  entryAt?: string; // ISO
  lunchStartAt?: string; // ISO
  lunchStopAt?: string; // ISO
  exitAt?: string; // ISO
  singles: string[]; // e.g., ["LUNCH_START"], if unmatched
  logs: RawLog[]; // raw that contributed (for drill-down)
};

const TORONTO_TZ = 'America/Toronto';

// normalize action labels
function norm(action: string) {
  const a = action.toUpperCase();
  if (a.startsWith('ENTRY')) return 'ENTRY';
  if (a.startsWith('EXIT')) return 'EXIT';
  if (
    a === 'LUNCH_START' ||
    a === 'LUNCH BEGIN' ||
    a === 'LUNCHBEGIN' ||
    a === 'LUNCH-START'
  )
    return 'LUNCH_START';
  if (
    a === 'LUNCH_END' ||
    a === 'LUNCH STOP' ||
    a === 'LUNCHEND' ||
    a === 'LUNCH-STOP'
  )
    return 'LUNCH_END';
  return a;
}

function toLocalDateKey(d: Date) {
  // Format to Toronto local YYYY-MM-DD without bringing in date-fns (server is UTC-safe here)
  const tzDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
  // en-CA gives YYYY-MM-DD
  return tzDate;
}

export function aggregateLogsToDaily(rows: RawLog[]): DailyRow[] {
  // group by userEmail + local date
  const map = new Map<string, DailyRow>();

  for (const r of rows) {
    const when = new Date(r.clientTime);
    const dateKey = toLocalDateKey(when);
    const email = (r.userEmail || '').toLowerCase();
    if (!email) continue;

    const key = `${email}::${dateKey}`;
    if (!map.has(key)) {
      map.set(key, {
        dateKey,
        userEmail: email,
        userName: r.userName ?? null,
        singles: [],
        logs: []
      });
    }
    const agg = map.get(key)!;
    const A = norm(r.action);
    agg.logs.push(r);

    // fill first seen timestamps for each slot; keep earliest occurrence
    const iso = new Date(r.clientTime).toISOString();
    if (A === 'ENTRY' && !agg.entryAt) agg.entryAt = iso;
    else if (A === 'LUNCH_START' && !agg.lunchStartAt) agg.lunchStartAt = iso;
    else if (A === 'LUNCH_END' && !agg.lunchStopAt) agg.lunchStopAt = iso;
    else if (A === 'EXIT' && !agg.exitAt) agg.exitAt = iso;
  }

  // compute singles
  for (const agg of map.values()) {
    const singles: string[] = [];
    if (!agg.entryAt) singles.push('ENTRY');
    if (agg.lunchStartAt && !agg.lunchStopAt) singles.push('LUNCH_END missing');
    if (agg.lunchStopAt && !agg.lunchStartAt)
      singles.push('LUNCH_START missing');
    if (!agg.exitAt) singles.push('EXIT');
    agg.singles = singles;
  }

  // sort by date desc, then user
  return Array.from(map.values()).sort((a, b) =>
    a.dateKey < b.dateKey
      ? 1
      : a.dateKey > b.dateKey
        ? -1
        : a.userEmail.localeCompare(b.userEmail)
  );
}

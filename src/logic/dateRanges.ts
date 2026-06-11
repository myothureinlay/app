export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from: string;
  to: string;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function iso(date: Date) {
  return date.toISOString();
}

function dateInput(value: string, end = false) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function dateRangeForPreset(preset: DateRangePreset, anchor = new Date(), custom?: Pick<DateRange, 'from' | 'to'>): DateRange {
  const today = startOfDay(anchor);
  const toToday = endOfDay(anchor);

  if (preset === 'custom' && custom) {
    return { preset, from: iso(dateInput(custom.from)), to: iso(dateInput(custom.to, true)) };
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { preset, from: iso(startOfDay(yesterday)), to: iso(endOfDay(yesterday)) };
  }

  if (preset === 'this_week' || preset === 'last_week') {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    if (preset === 'last_week') start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { preset, from: iso(startOfDay(start)), to: iso(endOfDay(end)) };
  }

  if (preset === 'this_month' || preset === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() + (preset === 'last_month' ? -1 : 0), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { preset, from: iso(startOfDay(start)), to: iso(endOfDay(end)) };
  }

  if (preset === 'this_quarter') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const start = new Date(today.getFullYear(), quarterStartMonth, 1);
    const end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
    return { preset, from: iso(startOfDay(start)), to: iso(endOfDay(end)) };
  }

  if (preset === 'this_year') {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return { preset, from: iso(startOfDay(start)), to: iso(endOfDay(end)) };
  }

  return { preset: 'today', from: iso(today), to: iso(toToday) };
}

export function isWithinDateRange(dateIso: string, range: Pick<DateRange, 'from' | 'to'>) {
  const time = new Date(dateIso).getTime();
  return time >= new Date(range.from).getTime() && time <= new Date(range.to).getTime();
}

// All dates are handled as ISO calendar strings (yyyy-mm-dd) and computed in UTC,
// so schedules never drift because of the viewer's timezone or DST.

const DAY = 86_400_000

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function today(): string {
  const now = new Date()
  return toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(parseISO(iso).getTime() + days * DAY))
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / DAY)
}

export function weekday(iso: string): number {
  // Monday = 0 … Sunday = 6
  return (parseISO(iso).getUTCDay() + 6) % 7
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
export const WEEKDAY_LABELS = WEEKDAYS

export function formatDate(iso: string, withWeekday = false): string {
  const [y, m, d] = iso.split('-')
  const base = `${d}/${m}/${y}`
  return withWeekday ? `${WEEKDAYS[weekday(iso)]}, ${base}` : base
}

export function formatShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function monthLabel(year: number, month: number): string {
  return `Tháng ${month + 1}/${year}`
}

export function relativeLabel(iso: string, ref = today()): string {
  const d = diffDays(iso, ref)
  if (d === 0) return 'Hôm nay'
  if (d === 1) return 'Ngày mai'
  if (d === -1) return 'Hôm qua'
  if (d > 0) return `${d} ngày nữa`
  return `Trễ ${-d} ngày`
}

/** Returns the 6×7 grid of ISO dates covering a month, starting on Monday. */
export function monthGrid(year: number, month: number): string[] {
  const first = toISO(new Date(Date.UTC(year, month, 1)))
  const start = addDays(first, -weekday(first))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

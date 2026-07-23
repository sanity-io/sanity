// Self-contained date helpers for the sandbox — avoids date-fns subpath resolution quirks in the
// test-studio's vite setup. Plain Date math is fine here (browser only, sandbox only).

const DAY_MS = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS)
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7)
}

export function addMonths(date: Date, n: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + n)
  return next
}

export function diffCalendarDays(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((a0.getTime() - b0.getTime()) / DAY_MS)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Monday-based start of week. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  return addDays(d, -dow)
}

export function fmtMonth(date: Date): string {
  return MONTHS[date.getMonth()]
}

export function fmtDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function fmtDayMonthTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hh}:${mm}`
}

export function fmtISODay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

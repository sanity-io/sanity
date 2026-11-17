/**
 * Relative date formatting for the Bisect tool ("3 days ago"), pure so it's
 * testable — the absolute timestamp stays available in a tooltip
 * (RelativeDate.tsx).
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const FORMATTER = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})

export function relativeDate(iso: string, nowMs: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return iso
  const elapsed = nowMs - then
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return FORMATTER.format(-Math.round(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return FORMATTER.format(-Math.round(elapsed / HOUR), 'hour')
  if (elapsed < 30 * DAY) return FORMATTER.format(-Math.round(elapsed / DAY), 'day')
  if (elapsed < 365 * DAY) return FORMATTER.format(-Math.round(elapsed / (30 * DAY)), 'month')
  return FORMATTER.format(-Math.round(elapsed / (365 * DAY)), 'year')
}

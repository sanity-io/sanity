import {BACKTEST_TIME_OF_DAY_UTC} from '../config'
import {DAY_MS, formatInstant} from '../time'
import {type IsoDate} from '../types'

const WEEK_MS = 7 * DAY_MS
const TUESDAY = 2
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function toInstant(value: IsoDate, boundary: 'start' | 'end'): number {
  if (DATE_ONLY.test(value)) {
    return Date.parse(boundary === 'start' ? `${value}T00:00:00Z` : `${value}T23:59:59.999Z`)
  }
  return Date.parse(value)
}

function firstTuesdayAtOrAfter(fromInstant: number): number {
  const dayStart = Date.parse(
    `${new Date(fromInstant).toISOString().slice(0, 10)}T${BACKTEST_TIME_OF_DAY_UTC}`,
  )
  const firstDay = dayStart < fromInstant ? dayStart + DAY_MS : dayStart
  const daysUntilTuesday = (TUESDAY - new Date(firstDay).getUTCDay() + 7) % 7
  return firstDay + daysUntilTuesday * DAY_MS
}

export function backtestDates(from: IsoDate, to: IsoDate): IsoDate[] {
  const first = firstTuesdayAtOrAfter(toInstant(from, 'start'))
  const last = toInstant(to, 'end')
  if (first > last) {
    return []
  }
  const count = Math.floor((last - first) / WEEK_MS) + 1
  return Array.from({length: count}, (_unused, index) => formatInstant(first + index * WEEK_MS))
}

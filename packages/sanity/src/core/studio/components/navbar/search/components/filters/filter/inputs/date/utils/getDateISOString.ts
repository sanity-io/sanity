import {endOfDay, startOfDay} from 'date-fns'

export type RoundDayValue = 'end' | 'start'

/**
 * Get the ISO 8601 string of a provided date.
 *
 * Returns a full ISO string if `datetime=true` (e.g. '2023-01-04T10:00:00.000Z')
 * Otherwise, returns a partial string containing only the date (e.g. '2023-01-04'),
 */
export function getDateISOString({
  date,
  dateOnly,
  roundDay,
}: {
  date: Date
  dateOnly?: boolean
  roundDay?: RoundDayValue
}): string {
  let adjustedDate: Date
  switch (roundDay) {
    case 'end':
      adjustedDate = endOfDay(date)
      break
    case 'start':
      adjustedDate = startOfDay(date)
      break
    default:
      adjustedDate = date
      break
  }

  return dateOnly ? adjustedDate.toISOString().split('T')[0] : adjustedDate.toISOString()
}

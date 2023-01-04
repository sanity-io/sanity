import {endOfDay, startOfDay} from 'date-fns'

export type RoundDayValue = 'end' | 'start'

/**
 * Get the ISO 8601 string of a provided date.
 *
 * Returns the full string if `datetime=true` (e.g. '2023-01-04T10:00:00.000Z'),
 * otherwise return a partial string containing only the date (e.g. '2023-01-04'),
 */
export function getDateISOString({
  date,
  isDateTime,
  roundDay,
}: {
  date?: Date | null
  isDateTime?: boolean
  roundDay?: RoundDayValue
}): string | null {
  if (!date) {
    return null
  }
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

  return isDateTime ? adjustedDate.toISOString() : adjustedDate.toISOString().split('T')[0]
}

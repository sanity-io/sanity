import {formatDistanceToNowStrict} from 'date-fns'

function getTimestamp(date: Date | number | string): number {
  if (typeof date === 'string') return Date.parse(date)
  if (date instanceof Date) return date.getTime()

  return date
}

export function shortRelativeDate(date: Date | number | string): string {
  const timestamp = getTimestamp(date)
  const now = Date.now()
  const timeDifference = Math.abs(timestamp - now)

  if (timeDifference < 60000) return 'just now' // Return 'just now' for times within 1 minute from now

  const suffix = timestamp < now ? ' ago' : ' from now'

  const formatMappings: Record<string, string> = {
    xDays: 'd',
    xHours: 'h',
    xMinutes: 'm',
    xMonths: 'mo',
    xYears: 'y',
    xSeconds: 'just now',
  }

  const options = {
    locale: {
      formatDistance: (unit: string, count: number) =>
        formatMappings[unit] ? `${count}${formatMappings[unit]}${suffix}` : 'just now',
    },
  }

  return formatDistanceToNowStrict(timestamp, options)
}

import {format, isToday, isYesterday, differenceInHours, differenceInMinutes} from 'date-fns'

export function formatHoursAgo(date: Date) {
  const now = Date.now()
  const h = differenceInHours(now, date)

  if (h) {
    return `${h}h`
  }

  const m = differenceInMinutes(now, date)

  if (m) {
    return `${m}m`
  }

  return 'Just now'
}

export function formatDate(date: Date) {
  if (isToday(date)) {
    return formatHoursAgo(date)
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mma')}`
  }

  return format(date)
}

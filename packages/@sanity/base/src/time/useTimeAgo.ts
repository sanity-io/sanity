import {useEffect, useState} from 'react'
import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears
} from 'date-fns'

interface TimeSpec {
  timestamp: string
  refreshInterval: number
}

const FIVE_SECONDS = 1000 * 5
const TWENTY_SECONDS = 1000 * 20
const ONE_MINUTE = 1000 * 60
const ONE_HOUR = ONE_MINUTE * 60

interface TimeAgoOpts {
  minimal?: boolean
}

export function useTimeAgo(time: Date | string, {minimal}: TimeAgoOpts = {}): string {
  const [resolved, setResolved] = useState(() => formatRelativeTime(time, {minimal}))

  useEffect(() => {
    setResolved(formatRelativeTime(time, {minimal}))
  }, [time, minimal])

  useEffect(() => {
    const id: number | undefined = Number.isFinite(resolved.refreshInterval)
      ? window.setInterval(
          () => setResolved(formatRelativeTime(time, {minimal})),
          resolved.refreshInterval
        )
      : undefined

    return () => clearInterval(id)
  }, [time, minimal, resolved.refreshInterval])

  return resolved.timestamp
}

function formatRelativeTime(date: Date | string, opts: TimeAgoOpts = {}): TimeSpec {
  const now = Date.now()
  const parsedDate = date instanceof Date ? date : new Date(date)

  const diffMonths = differenceInMonths(now, parsedDate)
  const diffYears = differenceInYears(now, parsedDate)

  if (diffMonths || diffYears) {
    if (opts.minimal && diffYears === 0) {
      // same year
      return {
        timestamp: format(parsedDate, 'MMM d'),
        refreshInterval: +Infinity
      }
    }

    if (opts.minimal) {
      return {
        timestamp: format(parsedDate, 'MMM d, yyyy'),
        refreshInterval: +Infinity
      }
    }

    return {
      timestamp: format(parsedDate, 'MMM d, yyyy, hh:mm a'),
      refreshInterval: +Infinity
    }
  }

  const diffWeeks = differenceInWeeks(now, parsedDate)
  if (diffWeeks) {
    if (opts.minimal) {
      return {timestamp: `${diffWeeks}w`, refreshInterval: ONE_HOUR}
    }

    return {timestamp: `${diffWeeks} weeks ago`, refreshInterval: ONE_HOUR}
  }

  const diffDays = differenceInDays(now, parsedDate)
  if (diffDays) {
    if (opts.minimal) {
      return {
        timestamp: diffDays === 1 ? 'yesterday' : `${diffDays}d`,
        refreshInterval: ONE_HOUR
      }
    }

    return {
      timestamp: diffDays === 1 ? 'yesterday' : `${diffDays} days ago`,
      refreshInterval: ONE_HOUR
    }
  }

  const diffHours = differenceInHours(now, parsedDate)
  if (diffHours) {
    if (opts.minimal) {
      return {timestamp: `${diffHours}h`, refreshInterval: ONE_MINUTE}
    }

    return {timestamp: `${diffHours} hours ago`, refreshInterval: ONE_MINUTE}
  }

  const diffMins = differenceInMinutes(now, parsedDate)
  if (diffMins) {
    if (opts.minimal) {
      return {timestamp: `${diffMins}m`, refreshInterval: TWENTY_SECONDS}
    }

    return {timestamp: `${diffMins} minutes ago`, refreshInterval: TWENTY_SECONDS}
  }

  const diffSeconds = differenceInSeconds(now, parsedDate)
  if (diffSeconds > 10) {
    if (opts.minimal) {
      return {timestamp: `${diffSeconds}s`, refreshInterval: FIVE_SECONDS}
    }

    return {timestamp: `${diffSeconds} seconds ago`, refreshInterval: FIVE_SECONDS}
  }

  return {timestamp: 'just now', refreshInterval: FIVE_SECONDS}
}

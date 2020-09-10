import {useEffect, useReducer} from 'react'
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

export function useTimeAgo(time: Date | string, opts: TimeAgoOpts = {}): string {
  const [resolved, setResolved] = useReducer(reduceState, null, () =>
    formatRelativeTime(time, opts)
  )

  useEffect(() => {
    const id: number | undefined = Number.isFinite(resolved.refreshInterval)
      ? window.setInterval(
          () => setResolved(formatRelativeTime(time, opts)),
          resolved.refreshInterval
        )
      : undefined

    return () => clearInterval(id)
  }, [time, resolved.refreshInterval])

  return resolved.timestamp
}

function reduceState(prev: TimeSpec, next: TimeSpec) {
  return prev.timestamp === next.timestamp && prev.refreshInterval === next.refreshInterval
    ? prev
    : next
}

// eslint-disable-next-line complexity
function formatRelativeTime(date: Date | string, opts: TimeAgoOpts = {}): TimeSpec {
  const now = Date.now()

  const diffMonths = differenceInMonths(now, date)
  const diffYears = differenceInYears(now, date)

  if (diffMonths || diffYears) {
    if (opts.minimal && diffYears === 0) {
      // same year
      return {
        timestamp: format(date, 'MMM D'),
        refreshInterval: +Infinity
      }
    }

    if (opts.minimal) {
      return {
        timestamp: format(date, 'MMM D, YYYY'),
        refreshInterval: +Infinity
      }
    }

    return {
      timestamp: format(date, 'MMM D, YYYY, hh:mm A'),
      refreshInterval: +Infinity
    }
  }

  const diffWeeks = differenceInWeeks(now, date)
  if (diffWeeks) {
    if (opts.minimal) {
      return {timestamp: `${diffWeeks}w`, refreshInterval: ONE_HOUR}
    }

    return {timestamp: `${diffWeeks} weeks ago`, refreshInterval: ONE_HOUR}
  }

  const diffDays = differenceInDays(now, date)
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

  const diffHours = differenceInHours(now, date)
  if (diffHours) {
    if (opts.minimal) {
      return {timestamp: `${diffHours}h`, refreshInterval: ONE_MINUTE}
    }

    return {timestamp: `${diffHours} hours ago`, refreshInterval: ONE_MINUTE}
  }

  const diffMins = differenceInMinutes(now, date)
  if (diffMins) {
    if (opts.minimal) {
      return {timestamp: `${diffMins}m`, refreshInterval: TWENTY_SECONDS}
    }

    return {timestamp: `${diffMins} minutes ago`, refreshInterval: TWENTY_SECONDS}
  }

  const diffSeconds = differenceInSeconds(now, date)
  if (diffSeconds > 10) {
    if (opts.minimal) {
      return {timestamp: `${diffSeconds}s`, refreshInterval: FIVE_SECONDS}
    }

    return {timestamp: `${diffSeconds} seconds ago`, refreshInterval: FIVE_SECONDS}
  }

  return {timestamp: 'just now', refreshInterval: FIVE_SECONDS}
}

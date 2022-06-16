import {useEffect, useState} from 'react'
import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from 'date-fns'
import pluralize from 'pluralize-esm'

interface TimeSpec {
  timestamp: string
  refreshInterval: number
}

const FIVE_SECONDS = 1000 * 5
const TWENTY_SECONDS = 1000 * 20
const ONE_MINUTE = 1000 * 60
const ONE_HOUR = ONE_MINUTE * 60

export interface TimeAgoOpts {
  minimal?: boolean
  agoSuffix?: boolean
}

export function useTimeAgo(time: Date | string, {minimal, agoSuffix}: TimeAgoOpts = {}): string {
  const [resolved, setResolved] = useState(() => formatRelativeTime(time, {minimal, agoSuffix}))

  useEffect(() => {
    setResolved(formatRelativeTime(time, {minimal, agoSuffix}))
  }, [time, minimal, agoSuffix])

  useEffect(() => {
    const id: number | undefined = Number.isFinite(resolved.refreshInterval)
      ? window.setInterval(
          () => setResolved(formatRelativeTime(time, {minimal, agoSuffix})),
          resolved.refreshInterval
        )
      : undefined

    return () => clearInterval(id)
  }, [time, minimal, resolved.refreshInterval, agoSuffix])

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
        refreshInterval: +Infinity,
      }
    }

    if (opts.minimal) {
      return {
        timestamp: format(parsedDate, 'MMM d, yyyy'),
        refreshInterval: +Infinity,
      }
    }

    return {
      timestamp: format(parsedDate, 'MMM d, yyyy, hh:mm a'),
      refreshInterval: +Infinity,
    }
  }

  const diffWeeks = differenceInWeeks(now, parsedDate)
  const weekSuffix = pluralize('week', diffWeeks)

  if (diffWeeks) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix ? `${diffWeeks}w ago` : `${diffWeeks}w`,
        refreshInterval: ONE_HOUR,
      }
    }

    return {
      timestamp: opts.agoSuffix ? `${diffWeeks} ${weekSuffix} ago` : `${diffWeeks} ${weekSuffix}`,
      refreshInterval: ONE_HOUR,
    }
  }

  const diffDays = differenceInDays(now, parsedDate)
  const daysSuffix = pluralize('days', diffDays)

  if (diffDays) {
    if (opts.minimal) {
      const daysSince = opts.agoSuffix ? `${diffDays}d ago` : `${diffDays}d`
      return {
        timestamp: diffDays === 1 ? 'yesterday' : daysSince,
        refreshInterval: ONE_HOUR,
      }
    }
    const daysSince = opts.agoSuffix ? `${diffDays} ${daysSuffix} ago` : `${diffDays} ${daysSuffix}`
    return {
      timestamp: diffDays === 1 ? 'yesterday' : daysSince,
      refreshInterval: ONE_HOUR,
    }
  }

  const diffHours = differenceInHours(now, parsedDate)
  const hoursSuffix = pluralize('hour', diffHours)

  if (diffHours) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix ? `${diffHours}h ago` : `${diffHours}h`,
        refreshInterval: ONE_MINUTE,
      }
    }

    return {
      timestamp: opts.agoSuffix ? `${diffHours} ${hoursSuffix} ago` : `${diffHours} ${hoursSuffix}`,
      refreshInterval: ONE_MINUTE,
    }
  }

  const diffMins = differenceInMinutes(now, parsedDate)
  const minsSuffix = pluralize('minute', diffMins)

  if (diffMins) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix ? `${diffMins}m ago` : `${diffMins}m`,
        refreshInterval: TWENTY_SECONDS,
      }
    }
    return {
      timestamp: opts.agoSuffix ? `${diffMins} ${minsSuffix} ago` : `${diffMins} ${minsSuffix}`,
      refreshInterval: TWENTY_SECONDS,
    }
  }

  const diffSeconds = differenceInSeconds(now, parsedDate)
  const secsSuffix = pluralize('second', diffSeconds)

  if (diffSeconds > 10) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix ? `${diffSeconds}s ago` : `${diffSeconds}s`,
        refreshInterval: FIVE_SECONDS,
      }
    }

    return {
      timestamp: opts.agoSuffix
        ? `${diffSeconds} ${secsSuffix} ago`
        : `${diffSeconds} ${secsSuffix}`,
      refreshInterval: FIVE_SECONDS,
    }
  }

  return {timestamp: 'just now', refreshInterval: FIVE_SECONDS}
}

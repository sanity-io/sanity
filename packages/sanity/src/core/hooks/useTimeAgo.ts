import {useEffect, useReducer} from 'react'
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
  format,
} from 'date-fns'
import pluralize from 'pluralize-esm'

interface TimeSpec {
  timestamp: string
  refreshInterval: number | null
}

const FIVE_SECONDS = 1000 * 5
const TWENTY_SECONDS = 1000 * 20
const ONE_MINUTE = 1000 * 60
const ONE_HOUR = ONE_MINUTE * 60

/** @internal */
export interface TimeAgoOpts {
  minimal?: boolean
  agoSuffix?: boolean
}

/** @internal */
export function useTimeAgo(time: Date | string, {minimal, agoSuffix}: TimeAgoOpts = {}): string {
  const resolved = formatRelativeTime(time, {minimal, agoSuffix})

  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    let timerId: number | null

    function tick(interval: number) {
      timerId = window.setTimeout(() => {
        forceUpdate()
        // avoid pile-up of setInterval callbacks,
        // e.g. schedule the next update at `refreshInterval` *after* the previous one finishes
        timerId = window.setTimeout(() => tick(interval), interval)
      }, interval)
    }

    if (resolved.refreshInterval !== null) {
      tick(resolved.refreshInterval)
    }

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId)
      }
    }
  }, [forceUpdate, resolved.refreshInterval])

  return resolved.timestamp
}

function formatRelativeTime(date: Date | string, opts: TimeAgoOpts = {}): TimeSpec {
  const parsedDate = date instanceof Date ? date : new Date(date)

  // Invalid date? Return empty timestamp and `null` as refresh interval, to save us from
  // continuously trying to format an invalid date. The `useEffect` calls in the hook will
  // trigger a re-evaluation of the timestamp when the date changes, so this is safe.
  if (!parsedDate.getTime()) {
    return {
      timestamp: '',
      refreshInterval: null,
    }
  }

  const now = Date.now()
  const diffMonths = differenceInMonths(now, parsedDate)
  const diffYears = differenceInYears(now, parsedDate)

  if (diffMonths || diffYears) {
    if (opts.minimal && diffYears === 0) {
      // same year
      return {
        timestamp: format(parsedDate, 'MMM d'),
        refreshInterval: null,
      }
    }

    if (opts.minimal) {
      return {
        timestamp: format(parsedDate, 'MMM d, yyyy'),
        refreshInterval: null,
      }
    }

    return {
      timestamp: format(parsedDate, 'MMM d, yyyy, hh:mm a'),
      refreshInterval: null,
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

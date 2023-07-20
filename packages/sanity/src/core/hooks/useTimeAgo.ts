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
import {useTranslation} from '../i18n'

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
  const resolved = useFormatRelativeTime(time, {minimal, agoSuffix})

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

function useFormatRelativeTime(date: Date | string, opts: TimeAgoOpts = {}): TimeSpec {
  const {t} = useTranslation()
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

  if (diffWeeks) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix
          ? t('timeAgo.weeks.minimal.ago', {count: diffWeeks})
          : t('timeAgo.weeks.minimal', {count: diffWeeks}),
        refreshInterval: ONE_HOUR,
      }
    }

    return {
      timestamp: opts.agoSuffix
        ? t('timeAgo.weeks.ago', {count: diffWeeks})
        : t('timeAgo.weeks', {count: diffWeeks}),
      refreshInterval: ONE_HOUR,
    }
  }

  const diffDays = differenceInDays(now, parsedDate)

  if (diffDays) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix
          ? t('timeAgo.days.minimal.ago', {count: diffDays})
          : t('timeAgo.days.minimal', {count: diffDays}),
        refreshInterval: ONE_HOUR,
      }
    }
    return {
      timestamp: opts.agoSuffix
        ? t('timeAgo.days.ago', {count: diffDays})
        : t('timeAgo.days', {count: diffDays}),
      refreshInterval: ONE_HOUR,
    }
  }

  const diffHours = differenceInHours(now, parsedDate)

  if (diffHours) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix
          ? t('timeAgo.hours.minimal.ago', {count: diffHours})
          : t('timeAgo.hours.minimal', {count: diffHours}),
        refreshInterval: ONE_MINUTE,
      }
    }

    return {
      timestamp: opts.agoSuffix
        ? t('timeAgo.hours.ago', {count: diffHours})
        : t('timeAgo.hours', {count: diffHours}),
      refreshInterval: ONE_MINUTE,
    }
  }

  const diffMins = differenceInMinutes(now, parsedDate)

  if (diffMins) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix
          ? t('timeAgo.minutes.minimal.ago', {count: diffMins})
          : t('timeAgo.minutes.minimal', {count: diffMins}),
        refreshInterval: TWENTY_SECONDS,
      }
    }
    return {
      timestamp: opts.agoSuffix
        ? t('timeAgo.minutes.ago', {count: diffMins})
        : t('timeAgo.minutes', {count: diffMins}),
      refreshInterval: TWENTY_SECONDS,
    }
  }

  const diffSeconds = differenceInSeconds(now, parsedDate)

  if (diffSeconds > 10) {
    if (opts.minimal) {
      return {
        timestamp: opts.agoSuffix
          ? t('timeAgo.seconds.minimal.ago', {count: diffSeconds})
          : t('timeAgo.seconds.minimal', {count: diffSeconds}),
        refreshInterval: FIVE_SECONDS,
      }
    }

    return {
      timestamp: opts.agoSuffix
        ? t('timeAgo.seconds.ago', {count: diffSeconds})
        : t('timeAgo.seconds', {count: diffSeconds}),
      refreshInterval: FIVE_SECONDS,
    }
  }

  return {timestamp: t('timeAgo.justNow'), refreshInterval: FIVE_SECONDS}
}

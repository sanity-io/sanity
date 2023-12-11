import {useCallback, useEffect, useReducer} from 'react'
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
} from 'date-fns'
import {useCurrentLocale, useTranslation} from '../i18n'
import {intlCache} from '../i18n/intlCache'

interface TimeSpec {
  timestamp: string
  refreshInterval: number | null
}

const FIVE_SECONDS = 1000 * 5
const TWENTY_SECONDS = 1000 * 20
const ONE_MINUTE = 1000 * 60
const ONE_HOUR = ONE_MINUTE * 60

const NO_YEAR_DATE_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
}

const DATE_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
  ...NO_YEAR_DATE_ONLY_FORMAT,
  year: 'numeric',
}

const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  ...DATE_ONLY_FORMAT,
  hour: 'numeric',
  minute: 'numeric',
}

/** @internal */
export interface RelativeTimeOptions {
  /**
   * Use `narrow` relative time styles and unit formatting. e.g. `3d ago`
   *
   * Note that this doesn't impact _numeric styling_. Returned values will always
   * return idiomatic phrasing like `yesterday` rather than `1d ago`, where possible.
   **/
  minimal?: boolean
  useTemporalPhrase?: boolean
  relativeTo?: Date
  timeZone?: string
}

/** @internal */
export function useRelativeTime(time: Date | string, options: RelativeTimeOptions = {}): string {
  const resolved = useFormatRelativeTime(time, options)

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

function useFormatRelativeTime(date: Date | string, opts: RelativeTimeOptions = {}): TimeSpec {
  const {t} = useTranslation()
  const currentLocale = useCurrentLocale().id

  const {timeZone, minimal} = opts
  const parsedDate = date instanceof Date ? date : new Date(date)
  const useTemporalPhrase = Boolean(opts.useTemporalPhrase)
  const format = useCallback(
    function formatWithUnit(count: number, unit: Intl.RelativeTimeFormatUnit): string {
      const isNextOrPrevDay = unit === 'day' && Math.abs(count) === 1
      if (useTemporalPhrase || isNextOrPrevDay) {
        return intlCache
          .relativeTimeFormat(currentLocale, {style: minimal ? 'narrow' : 'long', numeric: 'auto'})
          .format(count, unit)
      }

      return intlCache
        .numberFormat(currentLocale, {
          style: 'unit',
          unit,
          unitDisplay: minimal ? 'narrow' : 'long',
        })
        .format(Math.abs(count))
    },
    [currentLocale, useTemporalPhrase, minimal],
  )

  // Invalid date? Return empty timestamp and `null` as refresh interval, to save us from
  // continuously trying to format an invalid date. The `useEffect` calls in the hook will
  // trigger a re-evaluation of the timestamp when the date changes, so this is safe.
  if (!parsedDate.getTime()) {
    return {
      timestamp: '',
      refreshInterval: null,
    }
  }

  const now = opts.relativeTo || Date.now()
  const diffMonths = differenceInMonths(now, parsedDate)
  const diffYears = differenceInYears(now, parsedDate)

  if (diffMonths || diffYears) {
    if (opts.minimal && diffYears === 0) {
      // same year
      return {
        timestamp: intlCache
          .dateTimeFormat(currentLocale, {...NO_YEAR_DATE_ONLY_FORMAT, timeZone})
          .format(parsedDate),
        refreshInterval: null,
      }
    }

    if (opts.minimal) {
      return {
        timestamp: intlCache
          .dateTimeFormat(currentLocale, {...DATE_ONLY_FORMAT, timeZone})
          .format(parsedDate),
        refreshInterval: null,
      }
    }

    return {
      timestamp: intlCache
        .dateTimeFormat(currentLocale, {...FULL_DATE_FORMAT, timeZone})
        .format(parsedDate),
      refreshInterval: null,
    }
  }

  const diffWeeks = differenceInWeeks(parsedDate, now)
  if (diffWeeks) {
    return {
      timestamp: format(diffWeeks, 'week'),
      refreshInterval: ONE_HOUR,
    }
  }

  const diffDays = differenceInDays(parsedDate, now)
  if (diffDays) {
    return {
      timestamp: format(diffDays, 'day'),
      refreshInterval: ONE_HOUR,
    }
  }

  const diffHours = differenceInHours(parsedDate, now)
  if (diffHours) {
    return {
      timestamp: format(diffHours, 'hour'),
      refreshInterval: ONE_MINUTE,
    }
  }

  const diffMins = differenceInMinutes(parsedDate, now)
  if (diffMins) {
    return {
      timestamp: format(diffMins, 'minute'),
      refreshInterval: TWENTY_SECONDS,
    }
  }

  const diffSeconds = differenceInSeconds(parsedDate, now)
  if (Math.abs(diffSeconds) > 10) {
    return {
      timestamp: format(diffSeconds, 'second'),
      refreshInterval: FIVE_SECONDS,
    }
  }

  return {timestamp: t('relative-time.just-now'), refreshInterval: FIVE_SECONDS}
}

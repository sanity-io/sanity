import {differenceInDays} from 'date-fns/differenceInDays'
import {differenceInHours} from 'date-fns/differenceInHours'
import {differenceInMinutes} from 'date-fns/differenceInMinutes'
import {differenceInMonths} from 'date-fns/differenceInMonths'
import {differenceInSeconds} from 'date-fns/differenceInSeconds'
import {differenceInWeeks} from 'date-fns/differenceInWeeks'
import {differenceInYears} from 'date-fns/differenceInYears'
import {useEffect, useReducer} from 'react'

import {useCurrentLocale} from '../i18n/hooks/useLocale'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {intlCache} from '../i18n/intlCache'
import {type TFunction} from '../i18n/types'

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
  minimal?: boolean
  useTemporalPhrase?: boolean
  relativeTo?: Date
  timeZone?: string
}

/** @internal */
export function useRelativeTime(time: Date | string, options: RelativeTimeOptions = {}): string {
  const [now, updateNow] = useNow()
  const resolved = useFormatRelativeTime(time, options.relativeTo || now, options)
  useRefreshEvery(resolved.refreshInterval, updateNow)
  return resolved.timestamp
}

/**
 * A short relative time in the past, such as "5 min ago", "3 days ago" or "2 wk ago". Unlike
 * `useRelativeTime`, it never reads "yesterday" and never falls back to a date.
 *
 * @internal
 */
export function useCompactTimeAgo(time: Date | string): string {
  const {t} = useTranslation()
  const [now, updateNow] = useNow()
  const resolved = formatCompactTimeAgo(time instanceof Date ? time : new Date(time), now, t)
  useRefreshEvery(resolved.refreshInterval, updateNow)
  return resolved.timestamp
}

function useNow() {
  return useReducer(
    // We don't care about the action input, every update should use the current time as the new state
    () => Date.now(),
    // Since we use the third argument of `useReducer`, this `null` doesn't end up anywhere
    null,
    // By using the lazy init we ensure that `Date.now()` is only called once during init, and then only when `updateNow` is called, instead of on every render
    () => Date.now(),
  )
}

function useRefreshEvery(refreshInterval: number | null, refresh: () => void) {
  useEffect(() => {
    let timerId: number | null

    function tick(interval: number) {
      timerId = window.setTimeout(() => {
        refresh()
        // avoid pile-up of setInterval callbacks,
        // e.g. schedule the next update at `refreshInterval` *after* the previous one finishes
        timerId = window.setTimeout(() => tick(interval), interval)
      }, interval)
    }

    if (refreshInterval !== null) {
      tick(refreshInterval)
    }

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId)
      }
    }
  }, [refreshInterval, refresh])
}

function formatCompactTimeAgo(date: Date, now: number, t: TFunction): TimeSpec {
  if (!date.getTime()) {
    return {timestamp: '', refreshInterval: null}
  }

  const minutes = differenceInMinutes(now, date)
  if (minutes < 1) {
    return {timestamp: t('relative-time.just-now'), refreshInterval: TWENTY_SECONDS}
  }
  if (minutes < 60) {
    return {
      timestamp: t('relative-time.compact.minutes-ago', {count: minutes}),
      refreshInterval: ONE_MINUTE,
    }
  }

  const hours = differenceInHours(now, date)
  if (hours < 24) {
    return {
      timestamp: t('relative-time.compact.hours-ago', {count: hours}),
      refreshInterval: ONE_MINUTE,
    }
  }

  const days = differenceInDays(now, date)
  if (days < 7) {
    return {
      timestamp: t('relative-time.compact.days-ago', {count: days}),
      refreshInterval: ONE_HOUR,
    }
  }
  if (days < 30) {
    return {
      timestamp: t('relative-time.compact.weeks-ago', {count: differenceInWeeks(now, date)}),
      refreshInterval: ONE_HOUR,
    }
  }

  const years = differenceInYears(now, date)
  if (years < 1) {
    return {
      // 30 days can still be "0 months" (a 31-day month), so the count starts at one
      timestamp: t('relative-time.compact.months-ago', {
        count: Math.max(1, differenceInMonths(now, date)),
      }),
      refreshInterval: ONE_HOUR,
    }
  }
  return {
    timestamp: t('relative-time.compact.years-ago', {count: years}),
    refreshInterval: ONE_HOUR,
  }
}

function useFormatRelativeTime(
  date: Date | string,
  now: Date | number,
  opts: Omit<RelativeTimeOptions, 'relativeTo'> = {},
): TimeSpec {
  const {t} = useTranslation()
  const currentLocale = useCurrentLocale().id

  const {timeZone, minimal} = opts
  const parsedDate = date instanceof Date ? date : new Date(date)
  const useTemporalPhrase = Boolean(opts.useTemporalPhrase)
  const format = (count: number, unit: Intl.RelativeTimeFormatUnit): string => {
    const isNextOrPrevDay = unit === 'day' && Math.abs(count) === 1
    const isNextOrPrevWeek = unit === 'week' && Math.abs(count) === 1

    if (useTemporalPhrase || isNextOrPrevDay) {
      return intlCache
        .relativeTimeFormat(currentLocale, {
          // Force 'long' formatting for dates within the next/previous week as `Intl.RelativeTimeFormat`
          // will display these as `next wk.` or `last wk.` – which we don't want!
          // Idiomatic dates should always be displayed in full. There may be a more elegant way to handle this.
          style: minimal && !isNextOrPrevWeek ? 'short' : 'long',
          numeric: 'auto',
        })
        .format(count, unit)
    }

    return intlCache
      .numberFormat(currentLocale, {style: 'unit', unit, unitDisplay: minimal ? 'short' : 'long'})
      .format(Math.abs(count))
  }

  // Invalid date? Return empty timestamp and `null` as refresh interval, to save us from
  // continuously trying to format an invalid date. The `useEffect` calls in the hook will
  // trigger a re-evaluation of the timestamp when the date changes, so this is safe.
  if (!parsedDate.getTime()) {
    return {
      timestamp: '',
      refreshInterval: null,
    }
  }

  const diffMonths = differenceInMonths(now, parsedDate)
  const diffYears = differenceInYears(now, parsedDate)

  if (diffMonths || diffYears) {
    if (minimal && diffYears === 0) {
      // same year
      return {
        timestamp: intlCache
          .dateTimeFormat(currentLocale, {...NO_YEAR_DATE_ONLY_FORMAT, timeZone})
          .format(parsedDate),
        refreshInterval: null,
      }
    }

    if (minimal) {
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

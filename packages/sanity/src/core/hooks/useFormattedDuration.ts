import {useMemo} from 'react'
import {intlCache} from '../i18n/intlCache'
import {useCurrentLocale} from '../i18n/hooks/useLocale'
import {useListFormat} from './useListFormat'

type Duration = {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}
type DurationUnit = keyof Duration

const PERIODS = ['days', 'hours', 'minutes', 'seconds', 'milliseconds'] as const

/**
 * Options for the duration formatter
 *
 * @public
 */
export interface UseFormattedDurationOptions {
  /**
   * The formatting style to use in unit and list formatting. The default is "short".
   */
  style?: 'short' | 'long' | 'narrow'

  /**
   * The resolution of the duration. The default is "seconds".
   */
  resolution?: 'seconds' | 'milliseconds'
}

/**
 * The result of the duration formatter
 *
 * @public
 */
export interface FormattedDuration {
  /** The human-readable, formatted duration as a string, eg "2 days, 3 hr, and 20 sec" */
  formatted: string

  /** The machine-readable, formatted ISO-8601 duration string, eg "P2DT3H20S" */
  iso8601: string
}

/**
 * Formats a duration (in milliseconds) to a more user friendly string eg `1h 30m` or `1t 29m 15s`.
 * Can be configured to output full units, eg `1 hour 30 minutes` or `1 hour 3 minutes 15 seconds`.
 * Uses the current locale, which also applies to the division of units.
 *
 * @example English (en-US) locale formatting
 * ```ts
 * useFormattedDuration(5589000)
 * // {"formatted": "1 hour, 33 minutes, and 9 seconds", "iso8601": "PT1H33M9S"}
 * ```
 *
 * @example Norwegian (no-NB) locale formatting
 * ```ts
 * useFormattedDuration(5589000)
 * // {"formatted": "1 time, 33 minutter og 9 sekunder", "iso8601": "PT1H33M9S"}
 * ```
 *
 * @param options - Optional options for the number formatter
 * @returns An object with `formatted` and `iso8601` properties
 * @public
 */
export function useFormattedDuration(
  durationMs: number,
  options?: UseFormattedDurationOptions,
): FormattedDuration {
  const {style = 'short', resolution = 'seconds'} = options || {}
  const unitDisplay = style
  const locale = useCurrentLocale().id
  const listFormat = useListFormat({type: 'unit', style})
  const isNegative = durationMs < 0
  const duration = parseMilliseconds(Math.abs(durationMs))
  const formatters: Record<DurationUnit, Intl.NumberFormat> = useMemo(
    () => ({
      days: intlCache.numberFormat(locale, {style: 'unit', unit: 'day', unitDisplay}),
      hours: intlCache.numberFormat(locale, {style: 'unit', unit: 'hour', unitDisplay}),
      minutes: intlCache.numberFormat(locale, {style: 'unit', unit: 'minute', unitDisplay}),
      seconds: intlCache.numberFormat(locale, {style: 'unit', unit: 'second', unitDisplay}),
      milliseconds: intlCache.numberFormat(locale, {
        style: 'unit',
        unit: 'millisecond',
        unitDisplay,
      }),
    }),
    [locale, unitDisplay],
  )

  const parts: string[] = []
  for (const period of PERIODS) {
    const value = duration[period]
    if (!value || (resolution === 'seconds' && period === 'milliseconds')) {
      continue
    }

    const prefix = isNegative && parts.length === 0 ? '-' : ''
    parts.push(`${prefix}${formatters[period].format(value)}`)
  }

  const formatted =
    parts.length === 0
      ? // If passing duration 0, we still want to show something
        formatters[resolution].format(0)
      : // Usually, we want to join the parts with the locales list formatter
        listFormat.format(parts)

  const iso8601 = durationToISO8601(duration, isNegative)

  return {formatted, iso8601}
}

/**
 * Parse milliseconds to durations. We stop at days because months are not a fixed unit,
 * nor are years (365.25 strictly speaking, but people may expact calendar days). If we
 * wanted to include those, we'd want to use `intervalToDuration` from date-fns, and base
 * it on two specific dates.
 *
 * @param milliseconds - Milliseconds to parse
 * @returns Object of duration parts
 * @internal
 */
function parseMilliseconds(milliseconds: number): Duration {
  return {
    days: Math.trunc(milliseconds / 86400000),
    hours: Math.trunc(milliseconds / 3600000) % 24,
    minutes: Math.trunc(milliseconds / 60000) % 60,
    seconds: Math.trunc(milliseconds / 1000) % 60,
    milliseconds: Math.trunc(milliseconds) % 1000,
  }
}

/**
 * Format the given duration to an {@link https://en.wikipedia.org/wiki/ISO_8601#Durations | ISO-8601 duration}
 * string, eg `P1DT2H3M4.005S` meaning "1 day, 2 hours, 3 minutes, 4 seconds and 5 milliseconds".
 *
 * If days are zero, it will skip straight to the time part, eg `PT2H3M4.005S`.
 * If milliseconds are zero, it will skip the milliseconds part, eg `PT2H3M4S`.
 *
 * @param dur - The duration to format
 * @returns The formatted duration
 * @internal
 */
function durationToISO8601(dur: Duration, isNegative: boolean): string {
  const date = dur.days ? `${dur.days}D` : ''

  let time = ''
  if (dur.hours) time += `${dur.hours}H`
  if (dur.minutes) time += `${dur.minutes}M`

  if (dur.milliseconds) {
    time += `${((dur.seconds * 1000 + dur.milliseconds) / 1000).toFixed(3)}S`
  } else if (dur.seconds) {
    time += `${dur.seconds}S`
  }

  if (!date && !time) {
    return 'PT0S'
  }

  const parts = time ? [date, time] : [date]
  const duration = `P${parts.join('T')}`
  return isNegative ? `-${duration}` : duration
}

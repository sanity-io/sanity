/* eslint-disable @typescript-eslint/no-shadow */
import {TZDateMini} from '@date-fns/tz'
import {UTCDateMini} from '@date-fns/utc'
import {parse as dateFnsParse, parseISO} from 'date-fns'

import formatMomentLike from './datetime-formatter/formatter'
import momentToDateFnsFormat from './datetime-formatter/momentToDateFnsFormat'

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_TIME_FORMAT = 'HH:mm'
// take local as default time zone
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

export type ParseResult = {isValid: boolean; date?: Date; error?: string} & (
  | {isValid: true; date: Date}
  | {isValid: false; error?: string}
)

export function format(
  input: Date,
  format: string,
  options: {useUTC?: boolean; timeZone?: string} = {useUTC: false, timeZone: 'UTC'},
): string {
  const {useUTC, timeZone} = options

  if (useUTC) return formatMomentLike(new UTCDateMini(input), format)
  return formatMomentLike(new TZDateMini(input, timeZone || DEFAULT_TIMEZONE), format)
}

/*
  It would be so good to remove date-fns from this file, but it's used in the parse function. We could write our own parser,
  but this is better than moment.
 */
export function parse(dateString: string, format?: string, timeZone?: string): ParseResult {
  const dnsFormat = format ? momentToDateFnsFormat(format) : undefined

  // parse string to date using the format string from date-fns
  const parsed = dnsFormat ? dateFnsParse(dateString, dnsFormat, new Date()) : parseISO(dateString)
  if (parsed && !isNaN(parsed.getTime())) {
    const parsedDate =
      timeZone && isValidTimeZoneString(timeZone) ? new TZDateMini(parsed, timeZone) : parsed
    return {isValid: true, date: parsedDate}
  }
  return {isValid: false, error: `Invalid date. Must be on the format "${format}"`}
}

export function isValidTimeZoneString(timeZone: string): boolean {
  return Intl.supportedValuesOf('timeZone').includes(timeZone)
}

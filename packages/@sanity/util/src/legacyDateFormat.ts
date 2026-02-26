import {TZDateMini} from '@date-fns/tz'
import {UTCDateMini} from '@date-fns/utc'
import {parse as dateFnsParse} from 'date-fns/parse'
import {parseISO} from 'date-fns/parseISO'

import formatMomentLike from './datetime-formatter/formatter'
import {momentToDateFnsFormat} from './datetime-formatter/momentToDateFnsFormat'
import sanitizeLocale from './datetime-formatter/sanitizeLocale'

export {sanitizeLocale}

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
  dateFormat: string,
  options: {useUTC?: boolean; timeZone?: string} = {useUTC: false, timeZone: undefined},
): string {
  const {useUTC, timeZone} = options

  if (useUTC) return formatMomentLike(new UTCDateMini(input), dateFormat)
  return formatMomentLike(
    timeZone ? new TZDateMini(input, timeZone || DEFAULT_TIMEZONE) : new Date(input),
    dateFormat,
  )
}

/*
  It would be so good to remove date-fns from this file, but it's used in the parse function. We could write our own parser,
  but this is better than moment.
 */
export function parse(dateString: string, dateFormat?: string, timeZone?: string): ParseResult {
  const dnsFormat = dateFormat ? momentToDateFnsFormat(dateFormat) : undefined

  // parse string to date using the format string from date-fns
  const parsed = dnsFormat ? dateFnsParse(dateString, dnsFormat, new Date()) : parseISO(dateString)

  if (parsed && !isNaN(parsed.getTime())) {
    let parsedDate = parsed

    // Only apply timezone conversion if:
    // 1. A timezone is specified, AND
    // 2. A dateFormat was provided (meaning this is user input, not an ISO string being deserialized)
    if (timeZone && isValidTimeZoneString(timeZone) && dateFormat) {
      // Create TZDateMini using the component constructor to interpret the parsed
      // components as being in the target timezone. We can't use new TZDateMini(parsed, timeZone)
      // because dateFnsParse already created the Date in the browser's local timezone, which
      // would cause an incorrect conversion. By extracting components, we tell TZDateMini:
      // "these values represent the time in the target timezone directly"
      parsedDate = new TZDateMini(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        parsed.getHours(),
        parsed.getMinutes(),
        parsed.getSeconds(),
        parsed.getMilliseconds(),
        timeZone,
      )
    } else if (timeZone && isValidTimeZoneString(timeZone)) {
      // For ISO strings, just wrap in TZDateMini for display without conversion
      parsedDate = new TZDateMini(parsed, timeZone)
    }

    return {isValid: true, date: parsedDate}
  }
  return {isValid: false, error: `Invalid date. Must be on the format "${dateFormat}"`}
}

export function isValidTimeZoneString(timeZone: string): boolean {
  return Intl.supportedValuesOf('timeZone').includes(timeZone)
}

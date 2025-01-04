/* eslint-disable @typescript-eslint/no-shadow */
import moment from 'moment-timezone'

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_TIME_FORMAT = 'HH:mm'

export type ParseResult = {isValid: boolean; date?: Date; error?: string} & (
  | {isValid: true; date: Date}
  | {isValid: false; error?: string}
)

// todo: find a way to get rid of moment there.
// note: the format comes from peoples schema types, so we need to deprecate it for a while and
// find a way to tell people that they need to change it
export function format(
  input: Date,
  format: string,
  options: {useUTC?: boolean; timezone?: string} = {useUTC: false, timezone: 'UTC'},
) {
  const {useUTC, timezone} = options
  if (useUTC) return moment.utc(input).format(format)
  const m = timezone && isValidTimezoneString(timezone) ? moment(input).tz(timezone) : moment(input)
  return m.format(format)
}

export function parse(dateString: string, format?: string, timezone?: string): ParseResult {
  const parsed =
    timezone && isValidTimezoneString(timezone)
      ? moment(dateString, format, true).tz(timezone)
      : moment(dateString, format, true)

  if (parsed.isValid()) {
    return {isValid: true, date: parsed.toDate()}
  }
  return {isValid: false, error: `Invalid date. Must be on the format "${format}"`}
}

export function isValidTimezoneString(timezone: string) {
  return moment.tz.names().includes(timezone)
}

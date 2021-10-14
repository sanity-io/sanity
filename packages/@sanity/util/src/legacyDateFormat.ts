/* eslint-disable @typescript-eslint/no-shadow */
import moment from 'moment'

export type ParseResult = {isValid: boolean; date?: Date; error?: string} & (
  | {isValid: true; date: Date}
  | {isValid: false; error?: string}
)

// todo: find a way to get rid of moment there.
// note: the format comes form peoples schemas, so we need to deprecate it for a while and
// find a way to tell people that they need to change it
export function format(input: Date, format: string) {
  return moment(input).format(format)
}

export function parse(dateString: string, format: string): ParseResult {
  const parsed = moment(dateString, format, true)
  if (parsed.isValid()) {
    return {isValid: true, date: parsed.toDate()}
  }
  return {isValid: false, error: `Invalid date. Must be on the format "${format}"`}
}

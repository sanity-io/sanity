import {format} from 'date-fns'

import sanitizeLocale from './sanitizeLocale'

function getMonthName(
  date: Date,
  style: 'long' | 'short' | 'narrow' | undefined = 'long',
  locale = 'en-US',
): string {
  const validLocale = sanitizeLocale(locale)
  return new Intl.DateTimeFormat(validLocale, {month: style}).format(date)
}

function getDayName(
  date: Date,
  style: 'long' | 'short' | 'narrow' | undefined = 'long',
  locale = 'en-US',
): string {
  const validLocale = sanitizeLocale(locale)
  return new Intl.DateTimeFormat(validLocale, {weekday: style}).format(date)
}

/**
 * Zero-pads a number to `length` digits (e.g. zeroPad(7, 2) = "07").
 */
function zeroPad(num: number, length: number): string {
  return String(num).padStart(length, '0')
}

/**
 * Returns an English ordinal for a given day number
 */
function getOrdinal(day: number): string {
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) return `${day}st`
  if (j === 2 && k !== 12) return `${day}nd`
  if (j === 3 && k !== 13) return `${day}rd`
  return `${day}th`
}

function getISODayOfWeek(date: Date): number {
  // Sunday=0 in JS, but ISO calls Monday=1...Sunday=7
  const dow = date.getDay()
  return dow === 0 ? 7 : dow
}

function getISOWeekYear(date: Date): number {
  // Clone date, shift to the "Thursday" of this week
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayOfWeek = getISODayOfWeek(temp)
  temp.setUTCDate(temp.getUTCDate() - dayOfWeek + 4)
  return temp.getUTCFullYear()
}

function getISOWeekNumber(date: Date): number {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayOfWeek = getISODayOfWeek(temp)
  temp.setUTCDate(temp.getUTCDate() - dayOfWeek + 4)
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  return Math.ceil(((temp.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7)
}

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(Date.UTC(date.getFullYear(), 0, 1))
  // fix for local-time differences
  const diff =
    date.valueOf() -
    startOfYear.valueOf() +
    (startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

// "Locale" week-year => approximate with ISO logic here
function getLocaleWeekYear(date: Date): number {
  return getISOWeekYear(date)
}

/**
 * Returns fractional seconds based on the count of 'S' in the token.
 */
function getFractionalSeconds(date: Date, length: number): string {
  const ms = zeroPad(date.getMilliseconds(), 3) // "123"
  if (length === 1) {
    return ms.slice(0, 1) // "1"
  } else if (length === 2) {
    return ms.slice(0, 2) // "12"
  } else if (length === 3) {
    return ms // "123"
  }
  // length=4 => e.g. "1230"
  return `${ms}0`
}

function getTimeZoneAbbreviation(date: Date) {
  const parts = new Intl.DateTimeFormat(sanitizeLocale('en-US'), {
    timeZoneName: 'short',
  }).formatToParts(date)
  const tz = parts.find((part) => part.type === 'timeZoneName')
  return tz ? tz.value : ''
}

/**
 * Formats a Date object using many Moment-like tokens.
 */
function formatMomentLike(date: Date, formatStr: string): string {
  // Store escaped sequences to restore later
  const escapeSequences: string[] = []
  const escapeToken = '\uE000' // Use a Unicode private use character as placeholder

  // Replace bracketed content with placeholders
  const processedFormat = formatStr.replace(/\[([^\]]+)\]/g, (_, contents) => {
    escapeSequences.push(contents)
    return escapeToken
  })

  // Basic fields
  const year = date.getFullYear()
  const monthIndex = date.getMonth() // 0..11
  const dayOfMonth = date.getDate() // 1..31
  const dayOfWeek = date.getDay() // 0..6 (Sun=0)
  const hours = date.getHours() // 0..23
  const minutes = date.getMinutes() // 0..59
  const seconds = date.getSeconds() // 0..59

  // Week-related
  const isoWeekNum = getISOWeekNumber(date)
  const isoWeekYear = getISOWeekYear(date)
  const localeWeekYear = getLocaleWeekYear(date)

  // Timestamps
  const unixMs = date.getTime() // milliseconds since epoch
  const unixSec = Math.floor(unixMs / 1000) // seconds since epoch

  // Build token -> value map
  const tokens = [
    // Year
    // 1970 1971 ... 2029 2030
    {key: 'YYYY', value: String(year)},
    // 70 71 ... 29 30
    {key: 'YY', value: String(year).slice(-2)},
    // 1970 1971 ... 9999 +10000 +10001
    {key: 'Y', value: String(year)},
    // Expanded years, -001970 -001971 ... +001907 +001971
    {key: 'YYYYY', value: zeroPad(year, 5)},

    // ISO week-year
    // 1970 1971 ... 2029 2030
    {key: 'GGGG', value: String(isoWeekYear)},
    // 70 71 ... 29 30
    {key: 'GG', value: String(isoWeekYear).slice(-2)},

    // "locale" week-year
    {key: 'gggg', value: String(localeWeekYear)},
    {key: 'gg', value: String(localeWeekYear).slice(-2)},

    // Quarter
    {key: 'Q', value: String(Math.floor(monthIndex / 3) + 1)},
    {key: 'Qo', value: getOrdinal(Math.floor(monthIndex / 3) + 1)},

    // --- Month (using Intl) ---
    {key: 'MMMM', value: getMonthName(date, 'long')}, // e.g. "January"
    {key: 'MMM', value: getMonthName(date, 'short')}, // e.g. "Jan"
    // For numeric months, we still do a manual approach:
    {key: 'MM', value: zeroPad(monthIndex + 1, 2)},
    {key: 'M', value: String(monthIndex + 1)},
    {key: 'Mo', value: getOrdinal(monthIndex + 1)},

    // Day of Month
    {key: 'DD', value: zeroPad(dayOfMonth, 2)},
    {key: 'D', value: String(dayOfMonth)},
    {key: 'Do', value: getOrdinal(dayOfMonth)},

    // --- Day of Week (using Intl) ---
    {key: 'dddd', value: getDayName(date, 'long')}, // e.g. "Monday"
    {key: 'ddd', value: getDayName(date, 'short')}, // e.g. "Mon"
    {
      key: 'dd',
      // e.g. "Mo" => first 2 chars of short day name
      value: getDayName(date, 'short').slice(0, 2),
    },
    {key: 'd', value: String(dayOfWeek)},
    {key: 'do', value: getOrdinal(dayOfWeek + 1)},

    // Day of the year
    {key: 'DDDD', value: zeroPad(getDayOfYear(date), 3)},
    {key: 'DDD', value: String(getDayOfYear(date))},
    {key: 'DDDo', value: getOrdinal(getDayOfYear(date))},

    // ISO day of week
    {key: 'E', value: String(getISODayOfWeek(date))},

    // Day of Year
    {key: 'DDDD', value: zeroPad(getDayOfYear(date), 3)},
    {key: 'DDD', value: String(getDayOfYear(date))},

    // Week of the year
    // w 1 2 ... 52 53
    {key: 'w', value: zeroPad(isoWeekNum, 2)},
    // week 1st 2nd ... 52nd 53rd
    {key: 'wo', value: getOrdinal(isoWeekNum)},
    // 01 02 ... 52 53
    {key: 'ww', value: zeroPad(isoWeekNum, 2)},

    // ISO Week
    {key: 'WW', value: zeroPad(isoWeekNum, 2)},
    {key: 'W', value: String(isoWeekNum)},
    {key: 'Wo', value: getOrdinal(isoWeekNum)},

    // or "locale" week => replace isoWeekNum

    // 24h hours
    {key: 'HH', value: zeroPad(hours, 2)},
    {key: 'H', value: String(hours)},

    // 12h hours
    {key: 'hh', value: zeroPad(((hours + 11) % 12) + 1, 2)},
    {key: 'h', value: String(((hours + 11) % 12) + 1)},

    // 1 2 ... 23 24
    {key: 'k', value: String(hours || 24)},
    // 01 02 ... 23 24
    {key: 'kk', value: zeroPad(hours || 24, 2)},

    // Minutes
    {key: 'mm', value: zeroPad(minutes, 2)},
    {key: 'm', value: String(minutes)},

    // Seconds
    {key: 'ss', value: zeroPad(seconds, 2)},
    {key: 's', value: String(seconds)},

    // Fractional seconds (S..SSSS) => handled separately
    // Timezone offset (Z, ZZ) => handled separately

    // AM/PM
    {key: 'A', value: hours < 12 ? 'AM' : 'PM'},
    {key: 'a', value: hours < 12 ? 'am' : 'pm'},

    // Unix timestamps
    {key: 'X', value: String(unixSec)},
    {key: 'x', value: String(unixMs)},

    // Eras BC AD
    {key: 'N', value: year < 0 ? 'BC' : 'AD'},
    {key: 'NN', value: year < 0 ? 'BC' : 'AD'},
    {key: 'NNN', value: year < 0 ? 'BC' : 'AD'},

    // Before Christ, Anno Domini
    {key: 'NNNN', value: year < 0 ? 'Before Christ' : 'Anno Domini'},
    {key: 'NNNNN', value: year < 0 ? 'BC' : 'AD'},

    // Time zone offset
    {key: 'z', value: getTimeZoneAbbreviation(date)},
    {key: 'zz', value: getTimeZoneAbbreviation(date)},
    {key: 'Z', value: format(date, 'xxx')},
    {key: 'ZZ', value: format(date, 'xx')},
  ]

  // Sort tokens by descending length to avoid partial collisions
  tokens.sort((a, b) => b.key.length - a.key.length)

  // 1) Fractional seconds
  const fracSecRegex = /(S{1,4})/g
  let output = processedFormat.replace(fracSecRegex, (match) => {
    return getFractionalSeconds(date, match.length)
  })

  // Find each token and replace it, make sure not to replace overlapping tokens

  for (const {key, value} of tokens) {
    // Escape special characters
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match the token, but only if it's not part of a larger word
    const tokenRegex = new RegExp(`(^|[^A-Z0-9a-z])(${escapedKey})(?![A-Z0-9a-z])`, 'g')
    output = output.replace(tokenRegex, `$1${value}`)
  }

  // After all token replacements, restore escaped sequences
  output = output.replace(new RegExp(escapeToken, 'g'), () => escapeSequences.shift() || '')

  return output
}

export default formatMomentLike

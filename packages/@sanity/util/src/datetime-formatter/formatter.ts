import {format} from 'date-fns/format'

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

function getLocalizedDate(date: Date, options: Intl.DateTimeFormatOptions, locale = 'en-US') {
  const validLocale = sanitizeLocale(locale)
  return new Intl.DateTimeFormat(validLocale, options).format(date)
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
    {key: 'YYYY', getValue: () => String(year)},
    // 70 71 ... 29 30
    {key: 'YY', getValue: () => String(year).slice(-2)},
    // 1970 1971 ... 9999 +10000 +10001
    {key: 'Y', getValue: () => String(year)},
    // Expanded years, -001970 -001971 ... +001907 +001971
    {key: 'YYYYY', getValue: () => zeroPad(year, 5)},

    // ISO week-year
    // 1970 1971 ... 2029 2030
    {key: 'GGGG', getValue: () => String(isoWeekYear)},
    // 70 71 ... 29 30
    {key: 'GG', getValue: () => String(isoWeekYear).slice(-2)},

    // "locale" week-year
    {key: 'gggg', getValue: () => String(localeWeekYear)},
    {key: 'gg', getValue: () => String(localeWeekYear).slice(-2)},

    // Quarter
    {key: 'Q', getValue: () => String(Math.floor(monthIndex / 3) + 1)},
    {key: 'Qo', getValue: () => getOrdinal(Math.floor(monthIndex / 3) + 1)},

    // --- Month (using Intl) ---
    {key: 'MMMM', getValue: () => getMonthName(date, 'long')}, // e.g. "January"
    {key: 'MMM', getValue: () => getMonthName(date, 'short')}, // e.g. "Jan"
    // For numeric months, we still do a manual approach:
    {key: 'MM', getValue: () => zeroPad(monthIndex + 1, 2)},
    {key: 'M', getValue: () => String(monthIndex + 1)},
    {key: 'Mo', getValue: () => getOrdinal(monthIndex + 1)},

    // Day of Month
    {key: 'DD', getValue: () => zeroPad(dayOfMonth, 2)},
    {key: 'D', getValue: () => String(dayOfMonth)},
    {key: 'Do', getValue: () => getOrdinal(dayOfMonth)},

    // --- Day of Week (using Intl) ---
    {key: 'dddd', getValue: () => getDayName(date, 'long')}, // e.g. "Monday"
    {key: 'ddd', getValue: () => getDayName(date, 'short')}, // e.g. "Mon"
    {
      key: 'dd',
      // e.g. "Mo" => first 2 chars of short day name
      getValue: () => getDayName(date, 'short').slice(0, 2),
    },
    {key: 'd', getValue: () => String(dayOfWeek)},
    {key: 'do', getValue: () => getOrdinal(dayOfWeek + 1)},

    // Day of the year
    {key: 'DDDD', getValue: () => zeroPad(getDayOfYear(date), 3)},
    {key: 'DDD', getValue: () => String(getDayOfYear(date))},
    {key: 'DDDo', getValue: () => getOrdinal(getDayOfYear(date))},

    // ISO day of week
    {key: 'E', getValue: () => String(getISODayOfWeek(date))},

    // Week of the year
    // w 1 2 ... 52 53
    {key: 'w', getValue: () => zeroPad(isoWeekNum, 2)},
    // week 1st 2nd ... 52nd 53rd
    {key: 'wo', getValue: () => getOrdinal(isoWeekNum)},
    // 01 02 ... 52 53
    {key: 'ww', getValue: () => zeroPad(isoWeekNum, 2)},

    // ISO Week
    {key: 'WW', getValue: () => zeroPad(isoWeekNum, 2)},
    {key: 'W', getValue: () => String(isoWeekNum)},
    {key: 'Wo', getValue: () => getOrdinal(isoWeekNum)},

    // or "locale" week => replace isoWeekNum

    // 24h hours
    {key: 'HH', getValue: () => zeroPad(hours, 2)},
    {key: 'H', getValue: () => String(hours)},

    // 12h hours
    {key: 'hh', getValue: () => zeroPad(((hours + 11) % 12) + 1, 2)},
    {key: 'h', getValue: () => String(((hours + 11) % 12) + 1)},

    // 1 2 ... 23 24
    {key: 'k', getValue: () => String(hours || 24)},
    // 01 02 ... 23 24
    {key: 'kk', getValue: () => zeroPad(hours || 24, 2)},

    // Minutes
    {key: 'mm', getValue: () => zeroPad(minutes, 2)},
    {key: 'm', getValue: () => String(minutes)},

    // Seconds
    {key: 'ss', getValue: () => zeroPad(seconds, 2)},
    {key: 's', getValue: () => String(seconds)},

    // Fractional seconds (S..SSSS) => handled separately
    // Timezone offset (Z, ZZ) => handled separately

    // AM/PM
    {key: 'A', getValue: () => (hours < 12 ? 'AM' : 'PM')},
    {key: 'a', getValue: () => (hours < 12 ? 'am' : 'pm')},

    // Unix timestamps
    {key: 'X', getValue: () => String(unixSec)},
    {key: 'x', getValue: () => String(unixMs)},

    // Eras BC AD
    {key: 'N', getValue: () => (year < 0 ? 'BC' : 'AD')},
    {key: 'NN', getValue: () => (year < 0 ? 'BC' : 'AD')},
    {key: 'NNN', getValue: () => (year < 0 ? 'BC' : 'AD')},

    // Before Christ, Anno Domini
    {key: 'NNNN', getValue: () => (year < 0 ? 'Before Christ' : 'Anno Domini')},
    {key: 'NNNNN', getValue: () => (year < 0 ? 'BC' : 'AD')},

    // Time zone offset
    {key: 'z', getValue: () => getTimeZoneAbbreviation(date)},
    {key: 'zz', getValue: () => getTimeZoneAbbreviation(date)},
    {key: 'Z', getValue: () => format(date, 'xxx')},
    {key: 'ZZ', getValue: () => format(date, 'xx')},

    // Time
    {key: 'LTS', getValue: () => getLocalizedDate(date, {timeStyle: 'medium'})},
    {key: 'LT', getValue: () => getLocalizedDate(date, {timeStyle: 'short'})},

    // Date (uppercase = longer names)
    {
      key: 'LLLL',
      getValue: () =>
        getLocalizedDate(date, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
    },
    {
      key: 'LLL',
      getValue: () =>
        getLocalizedDate(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
    },
    {
      key: 'LL',
      getValue: () => getLocalizedDate(date, {year: 'numeric', month: 'long', day: 'numeric'}),
    },
    {
      key: 'L',
      getValue: () => getLocalizedDate(date, {year: 'numeric', month: '2-digit', day: '2-digit'}),
    },

    // Date (lowercase = shorter names)
    {
      key: 'llll',
      getValue: () =>
        getLocalizedDate(date, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
    },
    {
      key: 'lll',
      getValue: () =>
        getLocalizedDate(date, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
    },
    {
      key: 'll',
      getValue: () => getLocalizedDate(date, {year: 'numeric', month: 'short', day: 'numeric'}),
    },
    {
      key: 'l',
      getValue: () => getLocalizedDate(date, {year: 'numeric', month: 'numeric', day: 'numeric'}),
    },
  ]

  // Sort tokens by descending length to avoid partial collisions
  tokens.sort((a, b) => b.key.length - a.key.length)

  // 1) Fractional seconds (avoid colliding with LTS)
  const fracSecRegex = /(?<!LT)S{1,4}/g
  let output = processedFormat.replace(fracSecRegex, (match) => {
    return getFractionalSeconds(date, match.length)
  })

  // Find each token and replace it, make sure not to replace overlapping tokens
  for (const {key, getValue} of tokens) {
    // Escape special characters
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match the token, but only if it's not part of a larger word
    const tokenRegex = new RegExp(`(^|[^A-Z0-9a-z])(${escapedKey})(?![A-Z0-9a-z])`, 'g')

    // Only compute the value if the token exists in the output
    if (output.match(tokenRegex)) {
      const value = getValue()
      output = output.replace(tokenRegex, `$1${value}`)
    }
  }

  // After all token replacements, restore escaped sequences
  output = output.replace(new RegExp(escapeToken, 'g'), () => escapeSequences.shift() || '')

  return output
}

export default formatMomentLike

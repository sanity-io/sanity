import {formatRelative, isValid, parse} from 'date-fns'

interface FormatRelativeTzOptions {
  date: Date
  baseDate?: Date
  formatDateTz: (params: {date: Date; format?: string}) => string
  includeTimeZone?: boolean
  timeZoneAbbreviation?: string
  localTimeZoneAbbreviation?: string
}

/**
 * Format a date relative to now (or baseDate), with timezone awareness.
 * Uses relative terms like "tomorrow" or "in 2 days" when appropriate,
 * falls back to formatted date in the specified timezone.
 * @internal
 */
export function formatRelativeTz(options: FormatRelativeTzOptions): string {
  const {
    date,
    baseDate = new Date(),
    formatDateTz,
    includeTimeZone = false,
    timeZoneAbbreviation,
    localTimeZoneAbbreviation,
  } = options

  const dateFnsRelative = formatRelative(date, baseDate)
  const isAbsoluteDate = isValid(parse(dateFnsRelative, 'MM/dd/yyyy', new Date()))

  if (isAbsoluteDate) {
    const formatted = formatDateTz({date})

    const shouldAppendTimeZone =
      includeTimeZone &&
      timeZoneAbbreviation &&
      localTimeZoneAbbreviation &&
      timeZoneAbbreviation !== localTimeZoneAbbreviation

    if (shouldAppendTimeZone) {
      return `${formatted} (${timeZoneAbbreviation})`
    }

    return formatted
  }

  return dateFnsRelative
}

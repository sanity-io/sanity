import {Validators} from '@sanity/types'
import formatDate from 'date-fns/format'
import {genericValidators} from './genericValidator'

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

const isoDate =
  /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/

// eslint-disable-next-line no-warning-comments
// TODO (eventually): move these to schema type package
interface DateTimeOptions {
  // @todo accept object representing `Intl.DateTimeFormatOptions`? how do we localize?
  dateFormat?: string
  timeFormat?: string
}

const getFormattedDate = (type = '', value: string | number | Date, options?: DateTimeOptions) => {
  let format = 'yyyy-MM-dd'
  if (options && options.dateFormat) {
    format = options.dateFormat
  }

  if (type === 'date') {
    // If the type is date only
    return formatDate(new Date(value), format)
  }

  // If the type is datetime
  if (options && options.timeFormat) {
    format += ` ${options.timeFormat}`
  } else {
    format += ' HH:mm'
  }

  return formatDate(new Date(value), format)
}

function parseDate(date: unknown): Date | null
function parseDate(date: unknown, throwOnError: true): Date
function parseDate(date: unknown, throwOnError = false): Date | null {
  if (!date) return null
  if (date === 'now') return new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = new Date(date as any)
  const isInvalid = isNaN(parsed.getTime())
  if (isInvalid && throwOnError) {
    throw new Error(`Unable to parse "${date}" to a date`)
  }

  return isInvalid ? null : parsed
}

export const dateValidators: Validators = {
  ...genericValidators,

  type: (_unused, value, message, {i18n}) => {
    if (typeof value === 'undefined' || isoDate.test(`${value}`)) {
      return true
    }

    return message || i18n.t('validation:date.invalid-format')
  },

  min: (minDate, value, message, {type, i18n}) => {
    const dateVal = parseDate(value)
    if (!dateVal) {
      return true // `type()` should catch parse errors
    }

    if (!value || dateVal >= parseDate(minDate, true)) {
      return true
    }

    if (!type) {
      throw new Error(`\`type\` was not provided in validation context.`)
    }

    const dateTimeOptions: DateTimeOptions = isRecord(type.options)
      ? (type.options as DateTimeOptions)
      : {}

    return (
      message ||
      // Note that the `minDate` passed here is _formatted_, while the raw value provided to the
      // validator is available as `providedMinDate`. This because the formatted date is likely
      // what the developer wants to present to the user
      i18n.t('validation:date.minimum', {
        minDate: getFormattedDate(type.name, minDate, dateTimeOptions),
        providedMinDate: minDate,
      })
    )
  },

  max: (maxDate, value, message, {type, i18n}) => {
    const dateVal = parseDate(value)
    if (!dateVal) {
      return true // `type()` should catch parse errors
    }

    if (!value || dateVal <= parseDate(maxDate, true)) {
      return true
    }

    if (!type) {
      throw new Error(`\`type\` was not provided in validation context.`)
    }

    const dateTimeOptions: DateTimeOptions = isRecord(type.options)
      ? (type.options as DateTimeOptions)
      : {}

    return (
      message ||
      // Note that the `maxDate` passed here is _formatted_, while the raw value provided to the
      // validator is available as `providedMaxDate`. This because the formatted date is likely
      // what the developer wants to present to the user
      i18n.t('validation:date.maximum', {
        maxDate: getFormattedDate(type.name, maxDate, dateTimeOptions),
        providedMaxDate: maxDate,
      })
    )
  },
}

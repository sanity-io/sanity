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

  type: (_unused, value, message) => {
    const strVal = `${value}`
    if (!strVal || isoDate.test(value)) {
      return true
    }

    return message || 'Must be a valid ISO-8601 formatted date string'
  },

  min: (minDate, value, message, context) => {
    const dateVal = parseDate(value)
    if (!dateVal) {
      return true // `type()` should catch parse errors
    }

    if (!value || dateVal >= parseDate(minDate, true)) {
      return true
    }
    if (!context.type) {
      throw new Error(`\`type\` was not provided in validation context.`)
    }

    const dateTimeOptions: DateTimeOptions = isRecord(context.type.options)
      ? (context.type.options as DateTimeOptions)
      : {}

    const date = getFormattedDate(context.type.name, minDate, dateTimeOptions)

    return message || `Must be at or after ${date}`
  },

  max: (maxDate, value, message, context) => {
    const dateVal = parseDate(value)
    if (!dateVal) {
      return true // `type()` should catch parse errors
    }

    if (!value || dateVal <= parseDate(maxDate, true)) {
      return true
    }

    if (!context.type) {
      throw new Error(`\`type\` was not provided in validation context.`)
    }

    const dateTimeOptions: DateTimeOptions = isRecord(context.type.options)
      ? (context.type.options as DateTimeOptions)
      : {}

    const date = getFormattedDate(context.type.name, maxDate, dateTimeOptions)
    return message || `Must be at or before ${date}`
  },
}

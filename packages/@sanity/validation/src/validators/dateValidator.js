import formatDate from 'date-fns/format'
import ValidationError from '../ValidationError'
import genericValidator from './genericValidator'

// eslint-disable-next-line no-useless-escape
const isoDate = /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/

const getFormattedDate = (type = '', value, options) => {
  let format = 'yyyy-MM-dd'
  if (options && options.dateFormat) {
    format = options.dateFormat
  }
  if (type === 'date') {
    // If the type is date only
    return formatDate(value, format)
  }
  // If the type is datetime
  if (options && options.timeFormat) {
    format += ` ${options.timeFormat}`
  } else {
    format += ' HH:mm'
  }
  return formatDate(value, format)
}

const type = (unused, value, message) => {
  const strVal = `${value}`
  if (!strVal || isoDate.test(value)) {
    return true
  }

  return new ValidationError(message || 'Must be a valid ISO-8601 formatted date string')
}

const min = (minDate, value, message, field) => {
  const dateVal = value && parseDate(value)
  if (!dateVal) {
    return true // `type()` should catch parse errors
  }

  if (!value || dateVal >= parseDate(minDate, true)) {
    return true
  }
  const date = getFormattedDate(field.type.name, minDate, field.type.options)
  return new ValidationError(message || `Must be at or after ${date}`)
}

const max = (maxDate, value, message, field) => {
  const dateVal = value && parseDate(value)
  if (!dateVal) {
    return true // `type()` should catch parse errors
  }

  if (!value || dateVal <= parseDate(maxDate, true)) {
    return true
  }

  const date = getFormattedDate(field.type.name, maxDate, field.type.options)
  return new ValidationError(message || `Must be at or before ${date}`)
}

function parseDate(date, throwOnError) {
  if (date === 'now') {
    return new Date()
  }

  const parsed = new Date(date)
  const isInvalid = isNaN(parsed.getTime())
  if (isInvalid && throwOnError) {
    throw new Error(`Unable to parse "${date}" to a date`)
  }

  return isInvalid ? null : parsed
}

export default Object.assign({}, genericValidator, {
  type,
  min,
  max,
})

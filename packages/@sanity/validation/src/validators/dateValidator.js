const ValidationError = require('../ValidationError')
const genericValidator = require('./genericValidator')

const isoDate = /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/

const type = (unused, value, message) => {
  const strVal = `${value}`
  if (!strVal || isoDate.test(value)) {
    return true
  }

  return new ValidationError(message || 'Must be a valid ISO-8601 formatted date string')
}

const min = (minDate, value, message) => {
  const dateVal = value && parseDate(value)
  if (!dateVal) {
    return true // `type()` shoudl catch parse errors
  }

  if (!value || dateVal >= parseDate(minDate, true)) {
    return true
  }

  return new ValidationError(message || `Must be at or after ${minDate}`)
}

const max = (maxDate, value, message) => {
  const dateVal = value && parseDate(value)
  if (!dateVal) {
    return true // `type()` shoudl catch parse errors
  }

  if (!value || dateVal <= parseDate(maxDate, true)) {
    return true
  }

  return new ValidationError(message || `Must be before or at ${maxDate}`)
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

module.exports = Object.assign({}, genericValidator, {
  type,
  min,
  max
})

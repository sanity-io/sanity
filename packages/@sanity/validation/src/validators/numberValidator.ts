import ValidationError from '../ValidationError'
import genericValidator from './genericValidator'

const precisionRx = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/

const integer = (unused, value, message) => {
  if (!Number.isInteger(value)) {
    return new ValidationError(message || 'Must be an integer')
  }

  return true
}

const precision = (limit, value, message) => {
  if (typeof value === 'undefined') return true

  const places = value.toString().match(precisionRx)
  const decimals = Math.max(
    (places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0),
    0
  )

  if (decimals > limit) {
    return new ValidationError(message || `Max precision is ${limit}`)
  }

  return true
}

const min = (minNum, value, message) => {
  if (value >= minNum) {
    return true
  }

  return new ValidationError(message || `Must be greater than or equal ${minNum}`)
}

const max = (maxNum, value, message) => {
  if (value <= maxNum) {
    return true
  }

  return new ValidationError(message || `Must be less than or equal ${maxNum}`)
}

const greaterThan = (num, value, message) => {
  if (value > num) {
    return true
  }

  return new ValidationError(message || `Must be greater than ${num}`)
}

const lessThan = (maxNum, value, message) => {
  if (value < maxNum) {
    return true
  }

  return new ValidationError(message || `Must be less than ${maxNum}`)
}

export default Object.assign({}, genericValidator, {
  min,
  max,
  lessThan,
  greaterThan,
  integer,
  precision,
})

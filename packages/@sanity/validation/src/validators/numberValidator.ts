import {Validators} from '@sanity/types'
import genericValidator from './genericValidator'

const precisionRx = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/

const numberValidators: Validators = {
  ...genericValidator,

  integer: (_unused, value, message) => {
    if (!Number.isInteger(value)) {
      return message || 'Must be an integer'
    }

    return true
  },

  precision: (limit, value, message) => {
    if (value === undefined) return true

    const places = value.toString().match(precisionRx)
    const decimals = Math.max(
      (places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0),
      0
    )

    if (decimals > limit) {
      return message || `Max precision is ${limit}`
    }

    return true
  },

  min: (minNum, value, message) => {
    if (value >= minNum) {
      return true
    }

    return message || `Must be greater than or equal ${minNum}`
  },

  max: (maxNum, value, message) => {
    if (value <= maxNum) {
      return true
    }

    return message || `Must be less than or equal ${maxNum}`
  },

  greaterThan: (num, value, message) => {
    if (value > num) {
      return true
    }

    return message || `Must be greater than ${num}`
  },

  lessThan: (maxNum, value, message) => {
    if (value < maxNum) {
      return true
    }

    return message || `Must be less than ${maxNum}`
  },
}

export default numberValidators

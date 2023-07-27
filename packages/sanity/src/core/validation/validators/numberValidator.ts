import {Validators} from '@sanity/types'
import {genericValidators} from './genericValidator'

const precisionRx = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/

export const numberValidators: Validators = {
  ...genericValidators,

  integer: (_unused, value, message, {i18n}) => {
    if (!Number.isInteger(value)) {
      return message || i18n.t('validation:number.non-integer')
    }

    return true
  },

  precision: (limit, value, message, {i18n}) => {
    if (value === undefined) return true

    const places = value.toString().match(precisionRx)
    const decimals = Math.max(
      (places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0),
      0,
    )

    if (decimals > limit) {
      return message || i18n.t('validation:number.maximum-precision', {limit})
    }

    return true
  },

  min: (minNumber, value, message, {i18n}) => {
    if (value >= minNumber) {
      return true
    }

    return message || i18n.t('validation:number.minimum', {minNumber})
  },

  max: (maxNumber, value, message, {i18n}) => {
    if (value <= maxNumber) {
      return true
    }

    return message || i18n.t('validation:number.maximum', {maxNumber})
  },

  greaterThan: (threshold, value, message, {i18n}) => {
    if (value > threshold) {
      return true
    }

    return message || i18n.t('validation:number.greater-than', {threshold})
  },

  lessThan: (threshold, value, message, {i18n}) => {
    if (value < threshold) {
      return true
    }

    return message || i18n.t('validation:number.less-than', {threshold})
  },
}

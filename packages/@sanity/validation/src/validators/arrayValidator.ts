import {
  isArrayOfBlocksSchemaType,
  type Path,
  type PathSegment,
  type Validators,
} from '@sanity/types'

import {validationMarkerCodes} from '../codes'
import {deepEqualsIgnoreKey} from '../util/deepEqualsIgnoreKey'
import {genericValidators} from './genericValidator'

export const arrayValidators: Validators = {
  ...genericValidators,

  min: (minLength, value, message, {i18n, type}) => {
    if (!value || value.length >= minLength) {
      return true
    }

    const context = isArrayOfBlocksSchemaType(type) ? 'blocks' : undefined
    return {
      code: validationMarkerCodes.arrayMinimumLength,
      details: {actualLength: value.length, minimumLength: minLength},
      message: message || i18n.t('validation:array.minimum-length', {minLength, context}),
    }
  },

  max: (maxLength, value, message, {i18n, type}) => {
    if (!value || value.length <= maxLength) {
      return true
    }

    const context = isArrayOfBlocksSchemaType(type) ? 'blocks' : undefined
    return {
      code: validationMarkerCodes.arrayMaximumLength,
      details: {actualLength: value.length, maximumLength: maxLength},
      message: message || i18n.t('validation:array.maximum-length', {maxLength, context}),
    }
  },

  length: (wantedLength, value, message, {i18n, type}) => {
    if (!value || value.length === wantedLength) {
      return true
    }

    const context = isArrayOfBlocksSchemaType(type) ? 'blocks' : undefined
    return {
      code: validationMarkerCodes.arrayExactLength,
      details: {actualLength: value.length, expectedLength: wantedLength},
      message: message || i18n.t('validation:array.exact-length', {wantedLength, context}),
    }
  },

  presence: (flag, value, message, {i18n}) => {
    if (flag === 'required' && !value) {
      return {
        code: validationMarkerCodes.valueRequired,
        message: message || i18n.t('validation:generic.required', {context: 'array'}),
      }
    }

    return true
  },

  valid: (allowedValues, values, message, {i18n}) => {
    const valueType = typeof values
    if (valueType === 'undefined') {
      return true
    }

    const paths: Path[] = []
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      if (allowedValues.some((expected) => deepEqualsIgnoreKey(expected, value))) {
        continue
      }

      const pathSegment: PathSegment = value && value._key ? {_key: value._key} : i
      paths.push([pathSegment])
    }

    // we emit the same message for each path we find in this array
    const sharedMessage = message || i18n.t('validation:generic.not-allowed')

    return paths.map((path) => ({
      code: validationMarkerCodes.valueNotAllowed,
      details: {allowedValuesCount: allowedValues.length},
      message: sharedMessage,
      path,
    }))
  },

  unique: (_unused, value, message, {i18n}) => {
    const dupeIndices = []
    if (!value) {
      return true
    }

    for (let x = 0; x < value.length; x++) {
      for (let y = x + 1; y < value.length; y++) {
        const itemA = value[x]
        const itemB = value[y]

        if (!deepEqualsIgnoreKey(itemA, itemB)) {
          continue
        }

        if (dupeIndices.indexOf(x) === -1) {
          dupeIndices.push(x)
        }

        if (dupeIndices.indexOf(y) === -1) {
          dupeIndices.push(y)
        }
      }
    }

    const paths = dupeIndices.map((idx) => {
      const item = value[idx]
      const pathSegment = item && item._key ? {_key: item._key} : idx
      return [pathSegment]
    })

    // we emit the same message for each path we find in this array
    const sharedMessage = message || i18n.t('validation:array.item-duplicate')

    return paths.map((path) => ({
      code: validationMarkerCodes.arrayDuplicateItem,
      message: sharedMessage,
      path,
    }))
  },
}

import type {ValidationMarker, Validators} from '@sanity/types'
import {typeString} from '../util/typeString'
import {deepEquals} from '../util/deepEquals'
import {pathToString} from '../util/pathToString'
import {ValidationError as ValidationErrorClass} from '../ValidationError'

const SLOW_VALIDATOR_TIMEOUT = 5000

const formatValidationErrors = (options: {
  message: string | undefined
  results: ValidationMarker[]
  operation: 'AND' | 'OR'
}) => {
  let message

  if (options.message) {
    message = options.message
  } else if (options.results.length === 1) {
    message = options.results[0]?.item.message
  } else {
    message = `[${options.results
      .map((err) => err.item.message)
      .join(` - ${options.operation} - `)}]`
  }

  return new ValidationErrorClass(message, {
    children: options.results.length > 1 ? options.results : undefined,
    operation: options.operation,
  })
}

export const genericValidators: Validators = {
  type: (expected, value, message) => {
    const actualType = typeString(value)
    if (actualType !== expected && actualType !== 'undefined') {
      return message || `Expected type "${expected}", got "${actualType}"`
    }

    return true
  },

  presence: (expected, value, message) => {
    if (value === undefined && expected === 'required') {
      return message || 'Value is required'
    }

    return true
  },

  all: async (children, value, message, context) => {
    const resolved = await Promise.all(children.map((child) => child.validate(value, context)))
    const results = resolved.flat()

    if (!results.length) return true

    return formatValidationErrors({
      message,
      results,
      operation: 'AND',
    })
  },

  either: async (children, value, message, context) => {
    const resolved = await Promise.all(children.map((child) => child.validate(value, context)))
    const results = resolved.flat()

    // Read: There is at least one rule that matched
    if (results.length < children.length) return true

    return formatValidationErrors({
      message,
      results,
      operation: 'OR',
    })
  },

  valid: (allowedValues, actual, message) => {
    const valueType = typeof actual
    if (valueType === 'undefined') {
      return true
    }

    const value = (valueType === 'number' || valueType === 'string') && `${actual}`
    const strValue = value && value.length > 30 ? `${value.slice(0, 30)}…` : value

    const defaultMessage = value
      ? `Value "${strValue}" did not match any allowed values`
      : 'Value did not match any allowed values'

    return allowedValues.some((expected) => deepEquals(expected, actual))
      ? true
      : message || defaultMessage
  },

  custom: async (fn, value, message, context) => {
    const slowTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `Custom validator at ${pathToString(
          context.path,
        )} has taken more than ${SLOW_VALIDATOR_TIMEOUT}ms to respond`,
      )
    }, SLOW_VALIDATOR_TIMEOUT)

    let result
    try {
      result = await fn(value, context)
    } finally {
      clearTimeout(slowTimer)
    }

    if (typeof result === 'string') return message || result
    return result
  },
}

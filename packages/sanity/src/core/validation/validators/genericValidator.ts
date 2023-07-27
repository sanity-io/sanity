import type {ValidationMarker, Validators} from '@sanity/types'
import type {LocaleSource} from '../../i18n'
import {typeString} from '../util/typeString'
import {deepEquals} from '../util/deepEquals'
import {pathToString} from '../util/pathToString'
import {ValidationError as ValidationErrorClass} from '../ValidationError'

const SLOW_VALIDATOR_TIMEOUT = 5000

const formatValidationErrors = (options: {
  message: string | undefined
  results: ValidationMarker[]
  operation: 'AND' | 'OR'
  i18n: LocaleSource
}) => {
  let message: string

  if (options.message) {
    message = options.message
  } else if (options.results.length === 1) {
    message = options.results[0]?.item.message
  } else {
    const messages = options.results.map((err) => err.item.message)
    const type = options.operation === 'AND' ? 'conjunction' : 'disjunction'

    /**
     * Intentionally not i18n overridable (but still uses locale conjuction/disjunctions):
     * We have not really documented the use of the `.either()` and `.all()` validators, and while
     * they technically can be useful, we have not figured out a good way of displaying the errors
     * in a way that indicates their grouping. Once we've figured out how to do so, this string is
     * likely to be only for "fallback"/non-UI purposes.
     */
    const key = '{{messages, list}}'
    message = options.i18n.t(key, {
      messages,
      formatParams: {
        messages: {
          style: 'long',
          type,
        },
      },
    })
  }

  return new ValidationErrorClass(message, {
    children: options.results.length > 1 ? options.results : undefined,
    operation: options.operation,
  })
}

export const genericValidators: Validators = {
  type: (expectedType, value, message, {i18n}) => {
    const actualType = typeString(value)
    if (actualType !== expectedType && actualType !== 'undefined') {
      return message || i18n.t('validation:generic.incorrect-type', {actualType, expectedType})
    }

    return true
  },

  presence: (expected, value, message, {i18n}) => {
    if (value === undefined && expected === 'required') {
      return message || i18n.t('validation:generic.required')
    }

    return true
  },

  all: async (children, value, message, context) => {
    const resolved = await Promise.all(children.map((child) => child.validate(value, context)))
    const results = resolved.flat()

    if (results.length === 0) {
      return true
    }

    return formatValidationErrors({
      message,
      results,
      operation: 'AND',
      i18n: context.i18n,
    })
  },

  either: async (children, value, message, context) => {
    const resolved = await Promise.all(children.map((child) => child.validate(value, context)))
    const results = resolved.flat()

    // Read: There is at least one rule that matched
    if (results.length < children.length) {
      return true
    }

    return formatValidationErrors({
      message,
      results,
      operation: 'OR',
      i18n: context.i18n,
    })
  },

  valid: (allowedValues, actual, message, {i18n}) => {
    const valueType = typeof actual
    if (valueType === 'undefined') {
      return true
    }

    const value = (valueType === 'number' || valueType === 'string') && `${actual}`
    const strValue = value && value.length > 30 ? `${value.slice(0, 30)}…` : value

    return allowedValues.some((expected) => deepEquals(expected, actual))
      ? true
      : message ||
          i18n.t(
            'validation:generic.not-allowed',
            value ? {context: 'hint', replace: {hint: strValue}} : {}
          )
  },

  custom: async (fn, value, message, context) => {
    const slowTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `Custom validator at ${pathToString(
          context.path
        )} has taken more than ${SLOW_VALIDATOR_TIMEOUT}ms to respond`
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

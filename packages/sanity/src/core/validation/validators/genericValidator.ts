import {type ValidationMarker, type Validators} from '@sanity/types'

import {type LocaleSource} from '../../i18n'
import {deepEqualsIgnoreKey} from '../util/deepEqualsIgnoreKey'
import {isLocalizedMessages, localizeMessage} from '../util/localizeMessage'
import {pathToString} from '../util/pathToString'
import {typeString} from '../util/typeString'

const SLOW_VALIDATOR_TIMEOUT = 5000

const formatValidationErrors = (options: {
  message: string | undefined
  results: ValidationMarker[]
  operation: 'conjunction' | 'disjunction'
  i18n: LocaleSource
}) => {
  if (options.message) return options.message
  if (options.results.length === 1) return options.results[0]?.message

  // Intentionally hard-coded to use locale conjunction/disjunctions
  return options.i18n.t('{{messages, list}}', {
    messages: options.results.map((err) => err.message || err.item?.message),
    formatParams: {messages: {style: 'long', type: options.operation}},
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
      operation: 'conjunction',
      i18n: context.i18n,
    })
  },

  either: async (children, value, message, context) => {
    const resolved = await Promise.all(children.map((child) => child.validate(value, context)))
    const results = resolved.flat()

    // if one of the results is an empty array then at least one rule match
    if (resolved.find((result) => !result.length)) {
      return true
    }

    return formatValidationErrors({
      message,
      results,
      operation: 'disjunction',
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

    return allowedValues.some((expected) => deepEqualsIgnoreKey(expected, actual))
      ? true
      : message ||
          i18n.t(
            'validation:generic.not-allowed',
            value ? {context: 'hint', replace: {hint: strValue}} : {},
          )
  },

  custom: async (fn, value, message, context) => {
    const slowTimer = setTimeout(() => {
      // only show this warning in the studio
      if (context.environment !== 'studio') return

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

    if (isLocalizedMessages(result)) {
      return localizeMessage(result, context.i18n)
    }

    if (typeof result === 'string') {
      return message || result
    }

    return result
  },
}

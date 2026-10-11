import {type Validators} from '@sanity/types'

import {validationMarkerCodes} from '../codes'
import {genericValidators} from './genericValidator'

const DUMMY_ORIGIN = 'http://sanity'
const isRelativeUrl = (url: string) => /^\.*\//.test(url)
const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const stringValidators: Validators = {
  ...genericValidators,

  min: (minLength, value, message, {i18n}) => {
    if (!value || value.length >= minLength) {
      return true
    }

    return {
      code: validationMarkerCodes.stringMinimumLength,
      details: {actualLength: value.length, minimumLength: minLength},
      message: message || i18n.t('validation:string.minimum-length', {minLength}),
    }
  },

  max: (maxLength, value, message, {i18n}) => {
    if (!value || value.length <= maxLength) {
      return true
    }

    return {
      code: validationMarkerCodes.stringMaximumLength,
      details: {actualLength: value.length, maximumLength: maxLength},
      message: message || i18n.t('validation:string.maximum-length', {maxLength}),
    }
  },

  length: (wantedLength, value, message, {i18n}) => {
    const strValue = value || ''
    if (strValue.length === wantedLength) {
      return true
    }

    return {
      code: validationMarkerCodes.stringExactLength,
      details: {actualLength: strValue.length, expectedLength: wantedLength},
      message: message || i18n.t('validation:string.exact-length', {wantedLength}),
    }
  },

  uri: (constraints, value, message, {i18n}) => {
    const strValue = value || ''
    if (!strValue) {
      return true // `presence()` should catch empty values
    }

    const {options} = constraints
    const {allowCredentials, relativeOnly} = options
    const allowRelative = options.allowRelative || relativeOnly

    let url
    try {
      // WARNING: Safari checks for a given `base` param by looking at the length of arguments passed
      // to new URL(str, base), and will fail if invoked with new URL(strValue, undefined)
      url = allowRelative ? new URL(strValue, DUMMY_ORIGIN) : new URL(strValue)
    } catch {
      return {
        code: validationMarkerCodes.stringUrlInvalid,
        message: message || i18n.t('validation:string.url.invalid'),
      }
    }

    if (relativeOnly && url.origin !== DUMMY_ORIGIN) {
      return {
        code: validationMarkerCodes.stringUrlNotRelative,
        message: message || i18n.t('validation:string.url.not-relative'),
      }
    }

    if (!allowRelative && url.origin === DUMMY_ORIGIN && isRelativeUrl(strValue)) {
      return {
        code: validationMarkerCodes.stringUrlNotAbsolute,
        message: message || i18n.t('validation:string.url.not-absolute'),
      }
    }

    if (!allowCredentials && (url.username || url.password)) {
      return {
        code: validationMarkerCodes.stringUrlCredentialsNotAllowed,
        message: message || i18n.t('validation:string.url.includes-credentials'),
      }
    }

    const urlScheme = url.protocol.replace(/:$/, '')
    const isRelative = isRelativeUrl(strValue)
    const matchesAllowedScheme =
      isRelative || options.scheme.some((scheme) => scheme.test(urlScheme))
    if (!matchesAllowedScheme) {
      return {
        code: validationMarkerCodes.stringUrlSchemeNotAllowed,
        details: {scheme: urlScheme},
        message: message || i18n.t('validation:string.url.disallowed-scheme', {scheme: urlScheme}),
      }
    }

    return true
  },

  stringCasing: (casing, value, message, {i18n}) => {
    const strValue = value || ''
    if (casing === 'uppercase' && strValue !== strValue.toLocaleUpperCase()) {
      return {
        code: validationMarkerCodes.stringUppercase,
        message: message || i18n.t('validation:string.uppercase'),
      }
    }

    if (casing === 'lowercase' && strValue !== strValue.toLocaleLowerCase()) {
      return {
        code: validationMarkerCodes.stringLowercase,
        message: message || i18n.t('validation:string.lowercase'),
      }
    }

    return true
  },

  presence: (flag, value, message, {i18n}) => {
    if (flag === 'required' && !value) {
      return {
        code: validationMarkerCodes.valueRequired,
        message: message || i18n.t('validation:generic.required', {context: 'string'}),
      }
    }

    return true
  },

  regex: (options, value, message, {i18n}) => {
    const {pattern, name, invert} = options
    const regName = name || `${pattern.toString()}`
    const strValue = value || ''
    // Regexes with global or sticky flags are stateful (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex).
    // This resets the state stored from the previous check
    pattern.lastIndex = 0
    const matches = pattern.test(strValue)
    if ((!invert && !matches) || (invert && matches)) {
      return {
        code: invert
          ? validationMarkerCodes.stringRegexMatch
          : validationMarkerCodes.stringRegexMismatch,
        details: {invert, name: regName, pattern: pattern.source},
        message:
          message ||
          (invert
            ? i18n.t('validation:string.regex-match', {name: regName})
            : i18n.t('validation:string.regex-does-not-match', {name: regName})),
      }
    }

    return true
  },

  email: (_unused, value, message, {i18n}) => {
    const strValue = `${value || ''}`.trim()
    if (!strValue || emailRegex.test(strValue)) {
      return true
    }

    return {
      code: validationMarkerCodes.stringEmail,
      message: message || i18n.t('validation:string.email'),
    }
  },
}

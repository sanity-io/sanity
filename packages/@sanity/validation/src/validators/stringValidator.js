const ValidationError = require('../ValidationError')
const genericValidator = require('./genericValidator')

const DUMMY_ORIGIN = 'http://sanity'
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const isRelativeUrl = url => /^\.*\//.test(url)

const min = (minLength, value, message) => {
  if (!value || value.length >= minLength) {
    return true
  }

  return new ValidationError(message || `Must be at least ${minLength} characters long`)
}

const max = (maxLength, value, message) => {
  if (!value || value.length <= maxLength) {
    return true
  }

  return new ValidationError(message || `Must be at most ${maxLength} characters long`)
}

const length = (wantedLength, value, message) => {
  const strValue = value || ''
  if (strValue.length === wantedLength) {
    return true
  }

  return new ValidationError(message || `Must be exactly ${wantedLength} characters long`)
}

// eslint-disable-next-line complexity
const uri = (constraints, value, message) => {
  const strValue = value || ''
  const {options} = constraints
  const {allowCredentials, relativeOnly} = options
  const allowRelative = options.allowRelative || relativeOnly

  let url
  try {
    // WARNING: Safari checks for a given `base` param by looking at the length of arguments passed
    // to new URL(str, base), and will fail if invoked with new URL(strValue, undefined)
    url = allowRelative ? new URL(strValue, DUMMY_ORIGIN) : new URL(strValue)
  } catch (err) {
    return new ValidationError(message || 'Not a valid URL')
  }

  if (relativeOnly && url.origin !== DUMMY_ORIGIN) {
    return new ValidationError(message || 'Only relative URLs are allowed')
  }

  if (!allowRelative && url.origin === DUMMY_ORIGIN && isRelativeUrl(strValue)) {
    return new ValidationError(message || 'Relative URLs are not allowed')
  }

  if (!allowCredentials && (url.username || url.password)) {
    return new ValidationError(message || `Username/password not allowed`)
  }

  const urlScheme = url.protocol.replace(/:$/, '')
  const matchesAllowedScheme = options.scheme.some(scheme => scheme.test(urlScheme))
  if (!matchesAllowedScheme) {
    return new ValidationError(message || 'Does not match allowed protocols/schemes')
  }

  return true
}

const stringCasing = (casing, value, message) => {
  const strValue = value || ''
  if (casing === 'uppercase' && strValue !== strValue.toLocaleUpperCase()) {
    return new ValidationError(message || `Must be all uppercase letters`)
  }

  if (casing === 'lowercase' && strValue !== strValue.toLocaleLowerCase()) {
    return new ValidationError(message || `Must be all lowercase letters`)
  }

  return true
}

const presence = (flag, value, message) => {
  if (flag === 'required' && !value) {
    return new ValidationError(message || 'Required')
  }

  return true
}

const regex = (options, value, message) => {
  const {pattern, name, invert} = options
  const regName = name || `"${pattern.toString()}"`
  const strValue = value || ''
  const matches = pattern.test(strValue)
  if ((!invert && !matches) || (invert && matches)) {
    const defaultMessage = invert
      ? `Should not match ${regName}-pattern`
      : `Does not match ${regName}-pattern`

    return new ValidationError(message || defaultMessage)
  }

  return true
}

const email = (options, value, message) => {
  const strValue = `${value || ''}`.trim()
  if (!strValue || emailRegex.test(strValue)) {
    return true
  }

  return new ValidationError(message || 'Must be a valid email address')
}

module.exports = Object.assign({}, genericValidator, {
  stringCasing,
  presence,
  regex,
  length,
  email,
  min,
  max,
  uri
})

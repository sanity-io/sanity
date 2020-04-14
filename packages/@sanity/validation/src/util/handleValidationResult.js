/* eslint-disable complexity */
const ValidationError = require('../ValidationError')
const pathToString = require('./pathToString')

module.exports = (result, message, options) => {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return true
    }
    return result
  }

  if (result === true) {
    return true
  }

  if (typeof result === 'string') {
    return new ValidationError(message || result)
  }

  if (result && result.message && result.paths) {
    return new ValidationError(message || result.message, {paths: result.paths})
  }

  const path = pathToString(options.path)
  throw new Error(
    `${path}: Validator must return 'true' if valid or an error message as a string on errors`
  )
}

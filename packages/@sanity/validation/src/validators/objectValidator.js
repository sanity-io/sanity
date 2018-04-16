const ValidationError = require('../ValidationError')
const genericValidator = require('./genericValidator')

const presence = (expected, value, message) => {
  if (expected !== 'required') {
    return true
  }

  if (typeof value === 'undefined' || Object.keys(value).length === 0) {
    return new ValidationError(message || 'Required')
  }

  return true
}

const reference = (unused, value, message) => {
  if (!value) {
    return true
  }

  if (typeof value._ref !== 'string') {
    return new ValidationError(message || 'Must be a reference to a document', {paths: ['$']})
  }

  return true
}

module.exports = Object.assign({}, genericValidator, {
  presence,
  reference
})

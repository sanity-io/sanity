const ValidationError = require('../ValidationError')
const genericValidator = require('./genericValidator')

const presence = (flag, value, message) => {
  if (flag === 'required' && typeof value !== 'boolean') {
    return new ValidationError(message || 'Required')
  }

  return true
}

module.exports = Object.assign({}, genericValidator, {
  presence,
})

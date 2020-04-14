const ValidationError = require('../ValidationError')
const pathToString = require('../util/pathToString')
const handleValidationResult = require('../util/handleValidationResult')
const genericValidator = require('./genericValidator')

const metaKeys = ['_key', '_type', '_weak']

const presence = (expected, value, message) => {
  if (expected !== 'required') {
    return true
  }

  const keys = value && Object.keys(value).filter(key => !metaKeys.includes(key))
  if (typeof value === 'undefined' || (keys && keys.length === 0)) {
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

const block = async (validateBlock, value, message, options) => {
  let result
  try {
    result = await validateBlock(value, options)
  } catch (err) {
    const path = pathToString(options.path)
    err.message = `${path}: Error validating value: ${err.message}`
    throw err
  }

  return handleValidationResult(result, message, options)
}

const assetRequired = (flag, value, message) => {
  if (!value || !value.asset || !value.asset._ref) {
    const assetType = flag.assetType || 'Asset'
    return new ValidationError(message || `${assetType} required`)
  }

  return true
}

module.exports = Object.assign({}, genericValidator, {
  presence,
  reference,
  block,
  assetRequired
})

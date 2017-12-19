const {get, flatten} = require('lodash')
const ValidationError = require('./ValidationError')
const genericValidator = require('./validators/genericValidator')
const promiseLimiter = require('./util/promiseLimiter')

const typeValidators = {
  Boolean: require('./validators/booleanValidator'),
  Number: require('./validators/numberValidator'),
  String: require('./validators/stringValidator'),
  Array: require('./validators/arrayValidator'),
  Object: require('./validators/objectValidator'),
  Date: require('./validators/dateValidator')
}

module.exports = (rule, value, options = {}) => {
  const type = rule._type
  const validators = typeValidators[type] || genericValidator

  // Short-circuit on optional, empty fields
  if (!rule._required && (value === null || typeof value === 'undefined')) {
    return Promise.resolve([])
  }

  const tasks = rule._rules.map(createValidationTask)
  return Promise.all(tasks)
    .then(results => results.filter(Boolean))
    .then(flatten)

  function createValidationTask(curr) {
    const limiter = options.isChild ? promiseLimiter.children : promiseLimiter.root
    return limiter(() => validateRule(curr))
  }

  // eslint-disable-next-line complexity
  function validateRule(curr) {
    if (typeof curr.flag === 'undefined') {
      return Promise.reject(new Error('Invalid rule, did not contain "flag"-property'))
    }

    const validator = validators[curr.flag]
    if (!validator) {
      const forType = type ? `type "${type}"` : 'rule without declared type'
      return Promise.reject(new Error(`Validator for flag "${curr.flag}" not found for ${forType}`))
    }

    let itemConstraint = curr.constraint
    if (itemConstraint && itemConstraint.type === rule.FIELD_REF) {
      if (!options.parent) {
        return Promise.reject(new Error('Field reference provided, but no parent received'))
      }

      itemConstraint = get(options.parent, itemConstraint.path)
    }

    const result = validator(itemConstraint, value, rule._message, options)
    return Promise.resolve(result).then(processResult)
  }

  function processResult(result) {
    const hasError = result instanceof ValidationError
    if (!hasError) {
      return null
    }

    const results = []

    if (result.paths.length === 0) {
      // Add an item at "root" level (for arrays, the actual array)
      results.push({level: rule._level, item: result})
    }

    // Add individual items for each path
    return results.concat(result.paths.map(path => ({path, level: rule._level, item: result})))
  }
}

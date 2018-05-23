const {get, flatten} = require('lodash')
const ValidationError = require('./ValidationError')
const genericValidator = require('./validators/genericValidator')

const typeValidators = {
  Boolean: require('./validators/booleanValidator'),
  Number: require('./validators/numberValidator'),
  String: require('./validators/stringValidator'),
  Array: require('./validators/arrayValidator'),
  Object: require('./validators/objectValidator'),
  Date: require('./validators/dateValidator')
}

module.exports = (rule, value, options = {}) => {
  let rules = rule._rules

  const valueIsUndefined = value === null || typeof value === 'undefined'
  if (typeof rule._required === 'undefined' && valueIsUndefined) {
    // Run all _custom_ functions if the rule is not set to required or optional
    rules = rules.filter(curr => curr.flag === 'custom')
  } else if (!rule._required && valueIsUndefined) {
    // Short-circuit on optional, empty fields
    return Promise.resolve([])
  }

  const type = rule._type
  const validators = typeValidators[type] || genericValidator

  const tasks = rules.map(validateRule)
  return Promise.all(tasks)
    .then(results => results.filter(Boolean))
    .then(flatten)

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
    if (Array.isArray(result)) {
      return flatten(result.map(processResult))
    }

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

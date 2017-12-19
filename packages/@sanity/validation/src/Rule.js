const cloneDeep = require('clone-deep')
const validate = require('./validate')
const escapeRegex = require('./util/escapeRegex')
const createUriRegex = require('./util/createUriRegex')

const knownTypes = ['Object', 'String', 'Number', 'Boolean', 'Array', 'Date']
const isExclusive = ['type', 'uri', 'email']

class Rule {
  static FIELD_REF = Symbol('FIELD_REF')
  static array = () => new Rule().type('Array')
  static object = () => new Rule().type('Object')
  static string = () => new Rule().type('String')
  static number = () => new Rule().type('Number')
  static boolean = () => new Rule().type('Boolean')
  static dateTime = () => new Rule().type('Date')
  static valueOfField = path => ({type: Rule.FIELD_REF, path})

  constructor() {
    this.FIELD_REF = Rule.FIELD_REF

    this.reset()
  }

  // Alias to static method, since we often have access to an _instance_ of a rule but not the actual Rule class
  // eslint-disable-next-line class-methods-use-this
  valueOfField(...args) {
    return Rule.valueOfField(...args)
  }

  error(message) {
    const rule = this.clone()
    rule._level = 'error'
    rule._message = message || null
    return rule
  }

  warning(message) {
    const rule = this.clone()
    rule._level = 'warning'
    rule._message = message || null
    return rule
  }

  reset() {
    this._type = this._type || null
    this._rules = (this._rules || []).filter(rule => rule.flag === 'type')
    this._message = null
    this._required = false
    this._level = 'error'
    return this
  }

  isRequired() {
    return this._required
  }

  clone() {
    const rule = new Rule()
    rule._type = this._type
    rule._message = this._message
    rule._required = this._required
    rule._rules = cloneDeep(this._rules)
    rule._level = this._level
    return rule
  }

  cloneWithRules(rules) {
    const rule = this.clone()
    const newRules = new Set()
    rules.forEach(curr => {
      if (curr.flag === 'type') {
        rule._type = curr.constraint
      }

      newRules.add(curr.flag)
    })

    rule._rules = rule._rules
      .filter(curr => {
        const disallowDuplicate = isExclusive.includes(curr.flag)
        const isDuplicate = newRules.has(curr.flag)
        return !(disallowDuplicate && isDuplicate)
      })
      .concat(rules)

    return rule
  }

  merge(rule) {
    if (this._type && rule._type && this._type !== rule._type) {
      throw new Error('merge() failed: conflicting types')
    }

    const newRule = this.cloneWithRules(rule._rules)
    newRule._type = this._type || rule._type
    newRule._message = this._message || rule._message
    newRule._required = this._required || rule._required
    newRule._level = this._level === 'error' ? rule._level : this._level
    return newRule
  }

  validate(value, options = {}) {
    return validate(this, value, options)
  }

  // Validation flag setters
  type(targetType) {
    const type = `${targetType.slice(0, 1).toUpperCase()}${targetType.slice(1)}`
    if (!knownTypes.includes(type)) {
      throw new Error(`Unknown type "${targetType}"`)
    }

    const rule = this.cloneWithRules([{flag: 'type', constraint: type}])
    rule._type = type
    return rule
  }

  all(children) {
    return this.cloneWithRules([{flag: 'all', constraint: children}])
  }

  either(children) {
    return this.cloneWithRules([{flag: 'either', constraint: children}])
  }

  // Shared rules
  optional() {
    const rule = this.cloneWithRules([{flag: 'presence', constraint: 'optional'}])
    rule._required = false
    return rule
  }

  required() {
    const rule = this.cloneWithRules([{flag: 'presence', constraint: 'required'}])
    rule._required = true
    return rule
  }

  custom(fn) {
    return this.cloneWithRules([{flag: 'custom', constraint: fn}])
  }

  min(len) {
    return this.cloneWithRules([{flag: 'min', constraint: len}])
  }

  max(len) {
    return this.cloneWithRules([{flag: 'max', constraint: len}])
  }

  length(len) {
    return this.cloneWithRules([{flag: 'length', constraint: len}])
  }

  valid(value) {
    const values = Array.isArray(value) ? value : [value]
    return this.cloneWithRules([{flag: 'valid', constraint: values}])
  }

  // Numbers only
  integer() {
    return this.cloneWithRules([{flag: 'integer'}])
  }

  precision(limit) {
    return this.cloneWithRules([{flag: 'precision', constraint: limit}])
  }

  positive() {
    return this.cloneWithRules([{flag: 'min', constraint: 0}])
  }

  negative() {
    return this.cloneWithRules([{flag: 'lessThan', constraint: 0}])
  }

  greaterThan(num) {
    return this.cloneWithRules([{flag: 'greaterThan', constraint: num}])
  }

  lessThan(num) {
    return this.cloneWithRules([{flag: 'lessThan', constraint: num}])
  }

  // String only
  uppercase() {
    return this.cloneWithRules([{flag: 'stringCasing', constraint: 'uppercase'}])
  }

  lowercase() {
    return this.cloneWithRules([{flag: 'stringCasing', constraint: 'lowercase'}])
  }

  regex(pattern, name, opts) {
    let options = opts || {name}
    if (!opts && name && (name.name || name.invert)) {
      options = name
    }

    const constraint = Object.assign({}, options, {pattern})
    return this.cloneWithRules([{flag: 'regex', constraint}])
  }

  email(options) {
    return this.cloneWithRules([{flag: 'email', constraint: options}])
  }

  // eslint-disable-next-line complexity
  uri(opts = {}) {
    const options = Object.assign(
      {scheme: ['http', 'https'], allowRelative: false, relativeOnly: false},
      opts
    )

    let customScheme = ''

    if (
      !(options.scheme instanceof RegExp) &&
      typeof options.scheme !== 'string' &&
      !Array.isArray(options.scheme)
    ) {
      throw new Error('scheme must be a RegExp, String, or Array')
    }

    if (!Array.isArray(options.scheme)) {
      options.scheme = [options.scheme]
    }

    if (!options.scheme.length) {
      throw new Error('scheme must have at least 1 scheme specified')
    }

    // Flatten the array into a string to be used to match the schemes.
    for (let i = 0; i < options.scheme.length; ++i) {
      const scheme = options.scheme[i]
      if (!(scheme instanceof RegExp) && typeof scheme !== 'string') {
        throw new Error(`scheme at position ${i} must be a RegExp or String`)
      }

      // Add OR separators if a value already exists
      customScheme += customScheme ? '|' : ''

      const schemePattern = scheme instanceof RegExp ? scheme.source : escapeRegex(scheme)

      // If someone wants to match HTTP or HTTPS for example then we need to support
      // both RegExp and String so we don't escape their pattern unknowingly.
      if (!(scheme instanceof RegExp) && !/[a-zA-Z][a-zA-Z0-9+-\.]*/.test(scheme)) {
        throw new Error(`scheme at position ${i} must be a valid scheme`)
      }

      customScheme += schemePattern
    }

    const regex = createUriRegex(customScheme, options.allowRelative, options.relativeOnly)
    return this.cloneWithRules([{flag: 'uri', constraint: {options, regex}}])
  }

  // Array only
  unique(comparator) {
    return this.cloneWithRules([{flag: 'unique', constraint: comparator}])
  }

  // Objects only
  reference() {
    return this.cloneWithRules([{flag: 'reference'}])
  }
}

module.exports = Rule

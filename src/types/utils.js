import {difference, uniqWith} from 'lodash'
import PropTypes from 'proptypes'

export function ifNotUniqueProp(array, property, notUniqueFn) {
  uniqWith(array, (item, otherItem) => {
    if (item[property] === otherItem[property]) {
      notUniqueFn(item, otherItem)
    }
  })
}

const IMPLICIT_OPTIONS = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string,
  primitive: PropTypes.string,
  required: PropTypes.bool
}

export function checkSchemaType(schemaType, typeOptions) {

  const definedOptions = Object.assign({}, IMPLICIT_OPTIONS, typeOptions)
  const allowedOptionNames = Object.keys(definedOptions)
  const givenOptionNames = Object.keys(schemaType)

  const undeclared = difference(givenOptionNames, allowedOptionNames)

  let errors = []

  if (undeclared.length) {
    errors = undeclared.map(optionName => {
      return {
        schemaType,
        error: `Unknown property "${optionName}" on type "${schemaType.type}". Please check the type definition for "${schemaType.name}"`
      }
    })
  }

  return errors.concat(Object.keys(definedOptions).map(optionName => {
    const err = definedOptions[optionName](schemaType, optionName, schemaType.name, 'prop')
    if (err) {
      return {
        schemaType,
        error: err
      }
    }
    return null
  }).filter(Boolean))
}

export function createTypeBuilder(typeDescriptor) {
  return (schemaType, typeBuilders, schema) => {
    const result = checkSchemaType(schemaType, typeDescriptor.options)

    if (result.length) {
      result.forEach(validation => {
        console.error(validation.error)
      })
    }

    const options = Object.assign({}, typeDescriptor.defaultOptions, schemaType)

    const extra = typeDescriptor.parse ? typeDescriptor.parse(options, typeBuilders, schema) : {}
    return Object.assign({name: schemaType.name, type: schemaType.type}, options, extra)
  }
}

const toString = Object.prototype.toString
// Copied from https://github.com/ForbesLindesay/type-of, but inlined to have fine grained control

export function resolveJSType(val) {
  switch (toString.call(val)) {
    case '[object Function]': return 'function'
    case '[object Date]': return 'date'
    case '[object RegExp]': return 'regexp'
    case '[object Arguments]': return 'arguments'
    case '[object Array]': return 'array'
    case '[object String]': return 'string'
    default:
  }

  if (typeof val == 'object' && val && typeof val.length == 'number') {
    try {
      if (typeof val.callee == 'function') return 'arguments'
    } catch (ex) {
      if (ex instanceof TypeError) {
        return 'arguments'
      }
    }
  }

  if (val === null) {
    return 'null'
  }

  if (val === void 0) {
    return 'undefined'
  }

  if (val && val.nodeType === 1) {
    return 'element'
  }

  if (val === Object(val)) {
    return 'object'
  }

  return typeof val
}

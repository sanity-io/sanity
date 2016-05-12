import {pick} from 'lodash'

export function checkSchemaType(schemaType, propTypes) {
  return Object.keys(propTypes).map(key => {
    const err = propTypes[key](schemaType, key, 'name', 'prop')
    if (err) {
      return {
        schemaType,
        error: err
      }
    }
    return false
  }).filter(Boolean)
}

export function createTypeBuilder(typeDescriptor) {
  return (schemaType, typeBuilders, schema) => {
    const result = checkSchemaType(schemaType, typeDescriptor.options)

    if (result.length) {
      result.forEach(validation => {
        console.error(validation.error)
      })
    }
    const pickedOptions = pick(schemaType, ['name', 'primitive'].concat(Object.keys(typeDescriptor.options)))

    const options = Object.assign({}, typeDescriptor.defaultOptions, pickedOptions)

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

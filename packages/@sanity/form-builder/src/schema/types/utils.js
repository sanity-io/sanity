import primitives from './primitives'
import bundled from './bundled'
import {uniqWith} from 'lodash'

export function ifNotUniqueProp(array, property, notUniqueFn) {
  uniqWith(array, (item, otherItem) => {
    if (item[property] === otherItem[property]) {
      notUniqueFn(item, otherItem)
    }
  })
}

export function resolveJSONRepresentationOfSchemaType(schema, typeName) {
  if (typeName in primitives) {
    return typeName
  }
  if (typeName in bundled) {
    return bundled[typeName].primitive
  }
  const typeType = schema.getType(typeName)
  if (!typeType) {
    throw new Error(`Unable to resolve JSON type for ${typeName}`)
  }
  return resolveJSONRepresentationOfSchemaType(schema, typeType.type)
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
      if (typeof val.callee == 'function') { // eslint-disable-line max-depth
        return 'arguments'
      }
    } catch (ex) {
      if (ex instanceof TypeError) { // eslint-disable-line max-depth
        return 'arguments'
      }
    }
  }

  if (val === null) {
    return 'null'
  }

  if (val === undefined) {
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

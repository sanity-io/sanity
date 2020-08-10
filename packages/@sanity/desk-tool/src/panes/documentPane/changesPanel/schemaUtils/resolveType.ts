const toString = Object.prototype.toString
// Copied from https://github.com/ForbesLindesay/type-of, but inlined to have fine grained control

// eslint-disable-next-line complexity
export function resolveJSType(val) {
  switch (toString.call(val)) {
    case '[object Function]':
      return 'function'
    case '[object Date]':
      return 'date'
    case '[object RegExp]':
      return 'regexp'
    case '[object Arguments]':
      return 'arguments'
    case '[object Array]':
      return 'array'
    case '[object String]':
      return 'string'
    default:
  }

  if (typeof val == 'object' && val && typeof val.length == 'number') {
    try {
      // eslint-disable-next-line max-depth
      if (typeof val.callee == 'function') {
        return 'arguments'
      }
    } catch (ex) {
      // eslint-disable-next-line max-depth
      if (ex instanceof TypeError) {
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

export function resolveTypeName(value) {
  const jsType = resolveJSType(value)
  return (jsType === 'object' && '_type' in value && value._type) || jsType
}

const toString = Object.prototype.toString
// Copied from https://github.com/ForbesLindesay/type-of, but inlined to have fine grained control

export function resolveJSType(val: unknown) {
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

  if (typeof val == 'object' && val && typeof (val as any).length == 'number') {
    try {
      if (typeof (val as any).callee == 'function') {
        // eslint-disable-line max-depth
        return 'arguments'
      }
    } catch (ex) {
      if (ex instanceof TypeError) {
        // eslint-disable-line max-depth
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

  if (val && (val as any).nodeType === 1) {
    return 'element'
  }

  if (val === Object(val)) {
    return 'object'
  }

  return typeof val
}

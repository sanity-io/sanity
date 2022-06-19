const toString = Object.prototype.toString

// Copied from https://github.com/ForbesLindesay/type-of
// but inlined to have fine grained control
export function resolveJsType(val: unknown) {
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

  if (val === null) {
    return 'null'
  }

  if (val === undefined) {
    return 'undefined'
  }

  if (
    val &&
    typeof val === 'object' &&
    'nodeType' in val &&
    (val as {nodeType: unknown}).nodeType === 1
  ) {
    return 'element'
  }

  if (val === Object(val)) {
    return 'object'
  }

  return typeof val
}

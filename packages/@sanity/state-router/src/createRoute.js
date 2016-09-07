import isPlainObject from 'lodash/isplainobject'

function arrayify(fn) {
  return (...args) => {
    const ret = fn(...args)
    return Array.isArray(ret)
      ? ret
      : ret == null
      ? []
      : [ret]
  }
}

export default function createRoute(pattern, ...rest) {
  let options, children
  if (isPlainObject(rest[0]) || typeof rest[0] === 'string') {
    [options, children] = rest
    if (typeof options === 'string') {
      options = {activeKey: options}
    }
  }
  else {
    options = {}
    children = rest[0]
  }
  if (!pattern.includes(':')) {
    // throw new Error(`A route must include at least one unique parameter. Please check the route "${pattern}"`)
  }
  return {
    pattern,
    options: options || {},
    children: arrayify(typeof children === 'function' ? children : () => children)
  }
}
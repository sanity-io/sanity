import {pick} from 'lodash'

function isEmpty(object) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

function _stringify(value, options, depth) {
  if (depth > options.maxDepth) {
    return '...'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[empty]'
    }
    const capLength = Math.max(value.length - options.maxBreadth)
    const asString = value
      .slice(0, options.maxBreadth)
      .map((item, index) => _stringify(item, options, depth + 1))
      .concat(capLength > 0 ? `…+${capLength}` : [])
      .join(', ')

    return depth === 0 ? asString : `[${asString}]`
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value).filter(
      (key) => !options.ignoreKeys.includes(key) && typeof value[key] !== 'undefined',
    )

    if (isEmpty(pick(value, keys))) {
      return '{empty}'
    }

    const asString = keys
      .slice(0, options.maxBreadth)
      .map((key) => `${key}: ${_stringify(value[key], options, depth + 1)}`)
      .join(', ')

    return depth === 0 ? asString : `{${asString}}`
  }
  const asString = String(value)
  return asString === '' ? '""' : asString
}

export default function stringify(
  value,
  options: {maxDepth?: number; maxBreadth?: number; ignoreKeys?: string[]} = {},
) {
  const opts = {
    maxDepth: 'maxDepth' in options ? options.maxDepth : 2,
    maxBreadth: 'maxBreadth' in options ? options.maxBreadth : 2,
    ignoreKeys: 'ignoreKeys' in options ? options.ignoreKeys : [],
  }
  return _stringify(value, opts, 0)
}

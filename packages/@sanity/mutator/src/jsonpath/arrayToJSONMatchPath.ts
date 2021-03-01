// Converts an array of simple values (strings, numbers only) to a jsonmatch path string.

const IS_DOTTABLE = /^[a-z_$]+/

function stringifySegment(segment, hasLeading) {
  const type = typeof segment

  const isNumber = type === 'number'

  if (isNumber) {
    return `[${segment}]`
  }

  const isObject = type === 'object' && segment !== null && segment !== undefined

  if (isObject) {
    return Object.keys(segment)
      .map((key) => {
        const val = segment[key]
        return `[${key}=="${val}"]`
      })
      .join('')
  }

  if (IS_DOTTABLE.test(segment)) {
    return hasLeading ? segment : `.${segment}`
  }

  return `['${segment}']`
}

export default function arrayToJSONMatchPath(pathArray: Array<string | number | object>): string {
  return pathArray.reduce((acc, segment, index) => {
    return acc + stringifySegment(segment, index === 0)
  }, '')
}

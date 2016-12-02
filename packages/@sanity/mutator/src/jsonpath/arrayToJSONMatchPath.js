// @flow
// Converts an array of simple values (strings, numbers only) to a jsonmatch path string.

const IS_DOTTABLE = /^[a-z_$]+/

function stringifySegment(segment, hasLeading) {
  const isNumber = typeof segment === 'number'

  if (isNumber) {
    return `[${segment}]`
  }

  if (IS_DOTTABLE.test(segment)) {
    return hasLeading ? segment : `.${segment}`
  }

  return `['${segment}']`
}

export default function arrayToJSONMatchPath(pathArray : Array<string|number>) : string {
  return pathArray.reduce((acc, segment, index) => {
    return acc + stringifySegment(segment, index === 0)
  }, '')
}


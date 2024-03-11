import {type Path, type PathElement} from '../types'
import {isKeyedElement} from '../utils/predicates'

const IS_DOTTABLE = /^[a-z_$]+/

function stringifySegment(segment: PathElement, hasLeading: boolean): string {
  if (Array.isArray(segment)) {
    return `[${segment[0]}:${segment[1] || ''}]`
  }
  const type = typeof segment

  const isNumber = type === 'number'

  if (isNumber) {
    return `[${segment}]`
  }

  if (isKeyedElement(segment)) {
    return `[_key==${JSON.stringify(segment._key)}]`
  }

  if (typeof segment === 'string' && IS_DOTTABLE.test(segment)) {
    return hasLeading ? segment : `.${segment}`
  }

  return `['${segment}']`
}

export function stringify(pathArray: Path): string {
  return pathArray
    .map((segment, i) => stringifySegment(segment, i === 0))
    .join('')
}

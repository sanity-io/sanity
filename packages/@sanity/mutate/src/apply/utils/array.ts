import {isKeyedElement, type PathElement} from '../../path'
import {keyOf} from './getKeyOf'

export function findTargetIndex<T>(array: T[], pathSegment: PathElement) {
  if (typeof pathSegment === 'number') {
    return normalizeIndex(array.length, pathSegment)
  }
  if (isKeyedElement(pathSegment)) {
    const idx = array.findIndex(value => keyOf(value) === pathSegment._key)
    return idx === -1 ? null : idx
  }
  throw new Error(
    `Expected path segment to be addressing a single array item either by numeric index or by '_key'. Instead saw ${JSON.stringify(
      pathSegment,
    )}`,
  )
}

export function getTargetIdx(position: 'before' | 'after', index: number) {
  return position === 'before' ? index : index + 1
}

// normalizes the index according to the array length
// returns null if the normalized index is out of bounds
export function normalizeIndex(length: number, index: number) {
  if (length === 0 && (index === -1 || index === 0)) {
    return 0
  }
  const normalized = index < 0 ? length + index : index
  return normalized >= length || normalized < 0 ? null : normalized
}

// non-mutating splice
export function splice<T>(arr: T[], start: number, deleteCount: number): T[]
export function splice<T>(
  arr: T[],
  start: number,
  deleteCount: number,
  items: T[],
): T[]
export function splice<T>(
  arr: T[],
  start: number,
  deleteCount: number,
  items?: T[],
): T[] {
  const copy = arr.slice()
  copy.splice(start, deleteCount, ...(items || []))
  return copy
}

import {type KeyedPathElement, type Path, type PathElement} from '../types'

export function startsWith(parentPath: Path, path: Path): boolean {
  return (
    parentPath.length <= path.length &&
    parentPath.every((segment, i) => isElementEqual(segment, path[i]))
  )
}

export function isEqual(path: Path, otherPath: Path): boolean {
  return (
    path.length === otherPath.length &&
    path.every((segment, i) => isElementEqual(segment, otherPath[i]))
  )
}

export function isElementEqual(
  segmentA: PathElement,
  segmentB: PathElement,
): boolean {
  if (isKeyElement(segmentA) && isKeyElement(segmentB)) {
    return segmentA._key === segmentB._key
  }

  if (isIndexElement(segmentA)) {
    return Number(segmentA) === Number(segmentB)
  }

  return segmentA === segmentB
}

export function isKeyElement(
  segment: PathElement,
): segment is KeyedPathElement {
  return typeof (segment as any)?._key === 'string'
}
export function isIndexElement(segment: PathElement): segment is number {
  return typeof segment === 'number'
}

export function isKeyedElement(
  element: PathElement,
): element is KeyedPathElement {
  return (
    typeof element === 'object' &&
    '_key' in element &&
    typeof element._key === 'string'
  )
}
export function isArrayElement(
  element: PathElement,
): element is KeyedPathElement | number {
  return typeof element === 'number' || isKeyedElement(element)
}

export function isPropertyElement(element: PathElement): element is string {
  return typeof element === 'string'
}

// @flow
import type {Path, PathSegment} from '../typedefs/path'

export function isEqual(path: Path, otherPath: Path) {
  return path.length === otherPath.length
    && path.every((segment, i) => isSegmentEqual(segment, otherPath[i]))
}

export const FIRST_META_KEY = '$first'

export function isSegmentEqual(pathSegment: PathSegment, otherPathSegment: PathSegment) {
  const pathSegmentType = typeof pathSegment
  const otherPathSegmentType = typeof otherPathSegment
  if (pathSegmentType !== otherPathSegmentType) {
    return false
  }
  if (pathSegmentType === 'string' || pathSegmentType === 'number') {
    return pathSegment === otherPathSegment
  }
  if (!pathSegment || !otherPathSegment) {
    return false
  }
  return pathSegment._key === otherPathSegment._key
}

export function hasFocus(focusPath: Path, path: Path): boolean {
  const _withoutFirst = focusPath[focusPath.length - 1] === FIRST_META_KEY ? focusPath.slice(0, -1) : focusPath
  return isEqual(_withoutFirst, path)
}

export function hasItemFocus(focusPath: Path, item: Path): boolean {
  return focusPath.length === 1 && isSegmentEqual(focusPath[0], item)
}

export function isExpanded(segment: PathSegment, focusPath: Path): boolean {
  const [head, ...tail] = focusPath
  return tail.length > 0 && isSegmentEqual(segment, head)
}

export function startsWith(prefix: Path, path: Path): boolean {
  return prefix.every((segment, i) => isSegmentEqual(segment, path[i]))
}

export function trimLeft(prefix: Path, path: Path): Path {
  if (prefix.length === 0 || path.length === 0) {
    return path
  }
  const [prefixHead, ...prefixTail] = prefix
  const [pathHead, ...pathTail] = path
  if (!isSegmentEqual(prefixHead, pathHead)) {
    return path
  }
  return trimLeft(prefixTail, pathTail)
}

export function trimRight(suffix, path) {
  const sufLen = suffix.length
  const pathLen = path.length
  if (sufLen === 0 || pathLen === 0) {
    return path
  }

  let i = 0
  while (i < sufLen && i < pathLen && isSegmentEqual(path[pathLen - i - 1], suffix[sufLen - i - 1])) {
    i++
  }

  return path.slice(0, pathLen - i)
}

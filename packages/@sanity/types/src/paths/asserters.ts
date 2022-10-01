import type {PathSegment, KeyedSegment, IndexTuple} from './types'

const reKeySegment = /_key\s*==\s*['"](.*)['"]/
const reIndexTuple = /^\d*:\d*$/

/** @internal */
export function isIndexSegment(segment: PathSegment): segment is number {
  return typeof segment === 'number' || (typeof segment === 'string' && /^\[\d+\]$/.test(segment))
}

/** @internal */
export function isKeySegment(segment: PathSegment): segment is KeyedSegment {
  if (typeof segment === 'string') {
    return reKeySegment.test(segment.trim())
  }

  return typeof segment === 'object' && '_key' in segment
}

/** @internal */
export function isIndexTuple(segment: PathSegment): segment is IndexTuple {
  if (typeof segment === 'string' && reIndexTuple.test(segment)) {
    return true
  }

  if (!Array.isArray(segment) || segment.length !== 2) {
    return false
  }

  const [from, to] = segment
  return (typeof from === 'number' || from === '') && (typeof to === 'number' || to === '')
}

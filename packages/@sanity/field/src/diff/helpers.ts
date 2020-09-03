import {ObjectDiff, Diff, Path} from '../types'

export function getDiffAtPath(diff: ObjectDiff, path: Path): Diff | null {
  let node: Diff = diff

  for (const pathSegment of path) {
    if (node.type === 'object' && typeof pathSegment === 'string') {
      node = node.fields[pathSegment]
      // eslint-disable-next-line max-depth
      if (!node) return null
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof pathSegment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}

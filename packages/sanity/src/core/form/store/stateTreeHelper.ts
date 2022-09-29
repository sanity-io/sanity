import {isKeySegment, Path} from '@sanity/types'
import {StateTree} from './types'

/** @internal */
export function setAtPath<T>(
  currentTree: StateTree<T> | undefined,
  path: Path,
  value: T
): StateTree<T> {
  if (path.length === 0) {
    return {...(currentTree || {}), value}
  }
  const [head, ...tail] = path
  const key = isKeySegment(head) ? head._key : String(head)
  const children = currentTree?.children ?? {}
  return {
    value: currentTree?.value,
    children: {...children, [key]: setAtPath(children[key] || {}, tail, value)},
  }
}

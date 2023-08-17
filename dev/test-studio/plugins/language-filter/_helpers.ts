import {Path, StateTree, isArray} from 'sanity'

export function _isPathCollapsed(
  path: Path,
  state: StateTree<boolean> | undefined,
): boolean | undefined {
  if (!state) return undefined

  let node: StateTree<boolean> | undefined = state

  for (const segment of path) {
    if (!node) {
      return undefined
    }

    if (typeof segment === 'string') {
      node = node.children?.[segment]
    } else if (typeof segment === 'number') {
      node = node.children?.[segment]
    } else if (isArray(segment)) {
      node = node.children?.[String(segment[0])]
    } else {
      node = node.children?.[segment._key]
    }
  }

  return node?.value
}

import {type Path, type StateTree} from 'sanity'
import {isArray} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

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

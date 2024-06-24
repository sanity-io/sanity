import {type TreeEditingMenuItem} from '../../types'

export function getSiblingHasChildren(items: TreeEditingMenuItem[]): boolean {
  return items.some((sibling) => sibling.children && sibling.children.length > 0)
}

import {type DialogItem} from '../../types'

export function getSiblingHasChildren(items: DialogItem[]): boolean {
  return items.some((sibling) => sibling.children && sibling.children.length > 0)
}

import {type BreadcrumbItem} from '../../types'

export function getSiblingHasChildren(items: BreadcrumbItem[]): boolean {
  return items.some((sibling) => sibling.children && sibling.children.length > 0)
}

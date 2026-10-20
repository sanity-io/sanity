import {type Address, groupFor, groupsOf, pathOf} from '../compare/address'

// Navigation for the list work (E9 steps 4 and 6): paths of the structure URL, pure.

/** The current rack with `docId` added as one more pane at `address` (a local perspective): "Open beside". */
export function openDocBesidePath(
  pathname: string,
  type: string,
  docId: string,
  address: Address,
): string {
  const groups = groupsOf(pathname) ?? [type]
  return pathOf([...groups, `${groupFor(docId, address)},type=${type}`])
}

/** The list, then the document at the global perspective, then the same document at `against` as a second pane: the document as a comparison. */
export function comparisonPath(type: string, docId: string, against: Address): string {
  return pathOf([type, docId, groupFor(docId, against)])
}

/** The document id in a list row's href (`/structure/e9Set;e9-set-03?...`). */
export function docIdFromHref(href: string): {type: string; id: string} | null {
  const groups = groupsOf(new URL(href, window.location.origin).pathname)
  if (!groups || groups.length < 2) return null
  return {type: groups[0].split(',')[0], id: groups[groups.length - 1].split(',')[0]}
}

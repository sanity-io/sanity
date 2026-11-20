import {readVersionType} from '../../util/versionsUtils'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

/**
 * Whether the document group inventory shows more than the versions flyout does: the document has a
 * variant or any version besides Published and Draft (a release version, for one), or the flyout
 * lists fewer audiences than there are (`hiddenCount` above 0). A document with only Published
 * and/or Draft has nothing more to see there, so the flyout's footer row reads "Manage versions"
 * instead of "See all versions in the inventory".
 *
 * @internal
 */
export function hasMoreInInventory(
  groups: DocumentVersionStatusGroup[],
  hiddenCount: number,
): boolean {
  if (hiddenCount > 0) return true
  return groups.some(
    (group) =>
      Boolean(group.variantId) ||
      group.items.some((item) => {
        const type = readVersionType(item.version)
        return type !== 'published' && type !== 'draft'
      }),
  )
}

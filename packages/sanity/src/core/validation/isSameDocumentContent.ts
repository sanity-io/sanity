import {type SanityDocument} from '@sanity/types'
import omit from 'lodash-es/omit.js'

import {shallowEquals} from '../util/shallowEquals'

/**
 * Whether two snapshots of a document call for the same validation result.
 *
 * Snapshots with the same `_rev` count as the same: a local edit is applied before the server
 * acknowledges it, and validation picks it up when the acknowledgement brings the new `_rev`.
 * Across revisions only the other attributes count, as `_rev` and `_updatedAt` change on their
 * own when the acknowledgement arrives for content that was validated already.
 *
 * @internal
 */
export function isSameDocumentContent(
  prev: SanityDocument | null | undefined,
  next: SanityDocument | null | undefined,
): boolean {
  if (prev?._rev === next?._rev) {
    return true
  }
  return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
}

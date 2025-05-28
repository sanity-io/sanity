import {type SanityDocument} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'

/**
 * checks if the document has been set for unpublishing
 * @internal
 *
 * @param document - sanity document
 * @returns boolean if the system delete is set
 */
export function isGoingToUnpublish(document: SanityDocument | SanityDocumentLike): boolean {
  return Boolean(document._system?.delete === true)
}

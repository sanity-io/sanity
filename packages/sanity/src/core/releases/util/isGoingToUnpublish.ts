import {type SanityDocument} from '@sanity/client'

/**
 * checks if the document has been set for unpublishing
 * @internal
 *
 * @param document - sanity document
 * @returns boolean if the system delete is set
 */
export function isGoingToUnpublish(document: Partial<SanityDocument>): boolean {
  return Boolean(document._system?.delete === true)
}

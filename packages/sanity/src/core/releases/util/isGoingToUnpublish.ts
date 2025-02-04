import {type SanityDocument} from '@sanity/client'

/**
 * checks if the document has been set for unpublishing
 *
 * @param document - sanity document
 * @returns boolean if the system delete is set
 */
export function isGoingToUnpublish(document: SanityDocument): boolean {
  return document._system?.delete
}

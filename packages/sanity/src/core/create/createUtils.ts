import {type SanityDocumentLike} from '@sanity/types'

import {type CreateLinkedSanityDocument, type CreateLinkMetadata} from './types'

/**
 * @internal
 */
export function getCreateLinkMetadata(
  doc: SanityDocumentLike | undefined,
): CreateLinkMetadata | undefined {
  return (doc as CreateLinkedSanityDocument | undefined)?._create
}

/**
 * @internal
 */
export function isCreateLinked(metadata: CreateLinkMetadata | undefined): boolean {
  return metadata?.ejected === false
}

/**
 * @internal
 */
export function isCreateLinkedDocument(doc: SanityDocumentLike | undefined): boolean {
  return isCreateLinked(getCreateLinkMetadata(doc))
}

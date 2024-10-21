import {type BaseSchemaTypeOptions, type SanityDocumentLike, type SchemaType} from '@sanity/types'

import {type CreateLinkedSanityDocument, type CreateLinkMetadata} from './types'

/**
 * @internal
 */
export function getSanityCreateLinkMetadata(
  doc: SanityDocumentLike | undefined,
): CreateLinkMetadata | undefined {
  return (doc as CreateLinkedSanityDocument | undefined)?._create
}

/**
 * @internal
 */
export function isSanityCreateLinked(metadata: CreateLinkMetadata | undefined): boolean {
  return metadata?.ejected === false
}

/**
 * @internal
 */
export function isSanityCreateLinkedDocument(doc: SanityDocumentLike | undefined): boolean {
  return isSanityCreateLinked(getSanityCreateLinkMetadata(doc))
}

/**
 * @internal
 */
export function isSanityCreateExcludedType(schemaType: SchemaType): boolean {
  return !!(schemaType?.type?.options as BaseSchemaTypeOptions | undefined)?.sanityCreate?.exclude
}

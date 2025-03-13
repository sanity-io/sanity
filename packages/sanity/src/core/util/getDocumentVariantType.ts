import {isDraftId, isVersionId} from './draftUtils'

/**
 * Indicates the type of document variant, either `draft`, `version` or `published`.
 * Draft documents are prefixed with `drafts.`.
 * Version documents are prefixed with `versions.<versionName>`
 * The rest are considered published documents.
 * @public
 */
export type DocumentVariantType = 'draft' | 'version' | 'published'

/**
 * Takes a document id and returns the variant type for that document
 * If it's a document that starts with `version.` it's a `version` document.
 * If it's a document that starts with `drafts.` it's a `draft` document.
 * Otherwise, it's a `published` document.
 * @public
 * */
export function getDocumentVariantType(documentId: string): DocumentVariantType {
  if (isDraftId(documentId)) return 'draft'
  if (isVersionId(documentId)) return 'version'
  return 'published'
}

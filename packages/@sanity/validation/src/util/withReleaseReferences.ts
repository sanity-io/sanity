import {type DocumentId, getVersionId, getVersionNameFromId, isVersionId} from '@sanity/id-utils'
import {type SanityDocument} from '@sanity/types'

type DocumentCheck = (options: {id: string; signal?: AbortSignal}) => Promise<boolean>

/** @beta */
export interface ReleaseReferenceOptions {
  /** The document whose references are being checked. Variants require published references. */
  document: Pick<SanityDocument, '_id' | '_system'>
  /** Whether a document with the exact ID exists, including release unpublish markers. */
  getDocumentExists: DocumentCheck
  /** Whether the existing version document with the given ID unpublishes its document. */
  isUnpublished: DocumentCheck
}

/**
 * Resolves references from a release document the way Studio does: a reference to a document
 * in the same release exists even if it isn't published yet, unless the release unpublishes it.
 * Other documents are checked with `getDocumentExists` unchanged.
 *
 * @beta
 */
export function withReleaseReferences({
  document,
  getDocumentExists,
  isUnpublished,
}: ReleaseReferenceOptions): DocumentCheck {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- any document ID can be checked
  const id = document._id as DocumentId
  // oxlint-disable-next-line typescript/no-deprecated -- support unmigrated variant documents
  const variant = document._system?.variants?.[0]?._ref ?? document._system?.variant?._ref
  if (!isVersionId(id) || variant) return getDocumentExists
  const versionName = getVersionNameFromId(id)

  return async ({id: referenceId, signal}) => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- references hold document IDs
    const versionId = getVersionId(referenceId as DocumentId, versionName)
    const [versionExists, publishedExists] = await Promise.all([
      getDocumentExists({id: versionId, signal}),
      getDocumentExists({id: referenceId, signal}),
    ])
    if (!versionExists) return publishedExists
    return !(await isUnpublished({id: versionId, signal}))
  }
}

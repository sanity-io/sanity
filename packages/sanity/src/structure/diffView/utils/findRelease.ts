import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  type ReleaseDocument,
} from 'sanity'

/**
 * If the provided document id represents a version, find and return the corresponding release
 * document. Otherwise, return a string literal signifying whether the document id represents a
 * published or draft document.
 *
 * TODO: Return a type compatible with `TargetPerspective` (`"draft"` must be `"drafts"`).
 *
 * @internal
 */
export function findRelease(
  documentId: string,
  releases: ReleaseDocument[],
): ReleaseDocument | 'published' | 'draft' | undefined {
  if (isPublishedId(documentId)) {
    return 'published'
  }

  if (isDraftId(documentId)) {
    return 'draft'
  }

  return releases.find(
    ({_id}) => getReleaseIdFromReleaseDocumentId(_id) === getVersionFromId(documentId),
  )
}

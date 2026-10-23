import {getDraftId, getPublishedId, useDocumentVersions} from 'sanity'

/**
 * PROPOSED (open beta, Faheem 23 Oct): what Compare versions opens against, so the "..." menu offers it whenever the document has another version.
 * Core enables it only when the displayed version has an earlier layer in its release stack (`previousId`), so it was missing on a published
 * document with drafts, on a variant version and on the first release. The earlier layer still wins; otherwise the published version, then the
 * draft, then any other version of the document group. `undefined` only when the document has one version: the item stays, disabled, with its reason.
 *
 * @internal
 */
export function useCompareWithId({
  documentId,
  displayedId,
  previousId,
}: {
  documentId: string
  displayedId: string | undefined
  previousId: string | undefined
}): string | undefined {
  const publishedId = getPublishedId(documentId)
  const {versions} = useDocumentVersions({documentId: publishedId})
  if (previousId) return previousId
  const others = versions.map((v) => v._id).filter((id) => id !== displayedId)
  return (
    others.find((id) => id === publishedId) ??
    others.find((id) => id === getDraftId(publishedId)) ??
    others[0]
  )
}

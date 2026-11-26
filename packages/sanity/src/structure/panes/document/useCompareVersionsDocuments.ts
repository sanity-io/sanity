import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {
  type DocumentIdStack,
  type EditStateFor,
  useDocumentIdStack,
  useDocumentVersions,
} from 'sanity'

/**
 * The pair of document ids the "Compare versions" action opens the comparison with.
 *
 * @internal
 */
export interface CompareVersionsDocuments {
  previousId: string
  nextId: string
}

/**
 * Picks the documents to compare. The document layered directly beneath the displayed one comes
 * first. Without one, the displayed document is compared against the next layer, then against
 * any other document in the group: variants and anonymous bundles never take part in release
 * layering, but they are still versions of the document.
 *
 * Returns `undefined` when the group holds no other existing document.
 *
 * @internal
 */
export function getCompareVersionsDocuments({
  displayedId,
  documentIdStack,
  groupDocumentIds,
}: {
  displayedId: string | undefined
  documentIdStack: Pick<DocumentIdStack, 'position' | 'previousId' | 'nextId'>
  groupDocumentIds: string[]
}): CompareVersionsDocuments | undefined {
  if (typeof displayedId === 'undefined') return undefined

  const isDisplayedInStack = documentIdStack.position !== -1

  if (isDisplayedInStack && typeof documentIdStack.previousId !== 'undefined') {
    return {previousId: documentIdStack.previousId, nextId: displayedId}
  }

  if (isDisplayedInStack && typeof documentIdStack.nextId !== 'undefined') {
    return {previousId: displayedId, nextId: documentIdStack.nextId}
  }

  // A document that does not exist yet (being created) has nothing to be compared with.
  if (!groupDocumentIds.includes(displayedId)) return undefined

  const otherId = groupDocumentIds.find((id) => id !== displayedId)
  return typeof otherId === 'undefined' ? undefined : {previousId: displayedId, nextId: otherId}
}

/**
 * @internal
 */
export function useCompareVersionsDocuments({
  displayed,
  documentId,
  editState,
}: {
  displayed: Partial<SanityDocument> | null | undefined
  documentId: string
  editState: EditStateFor | null
}): CompareVersionsDocuments | undefined {
  const {position, previousId, nextId} = useDocumentIdStack({
    strict: true,
    displayed: displayed ?? null,
    documentId,
    editState,
  })
  const {data: groupDocumentIds} = useDocumentVersions({documentId})
  const displayedId = displayed?._id

  return useMemo(
    () =>
      getCompareVersionsDocuments({
        displayedId,
        documentIdStack: {position, previousId, nextId},
        groupDocumentIds,
      }),
    [displayedId, groupDocumentIds, nextId, position, previousId],
  )
}

import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {getPublishedId} from '../../util/draftUtils'
import {INITIAL_COMPANION_DOCS} from '../store/createCanvasCompanionDocsStore'
import {useCanvasCompanionDocsStore} from '../store/useCanvasCompanionDocsStore'

/**
 * Given a document id, returns whether it is linked to canvas and the companion doc if it exists.
 * @beta
 */
export const useCanvasCompanionDoc = (documentId: string) => {
  const companionDocsStore = useCanvasCompanionDocsStore()
  const publishedId = getPublishedId(documentId)

  const companionDocs$ = useMemo(
    () => companionDocsStore.getCompanionDocs(publishedId),
    [publishedId, companionDocsStore],
  )
  // The lookup starts out loading, and the actions that depend on the link state stay hidden while
  // it is — rendering anything else before the subscription emits would enable them for a moment.
  const companionDocs = useObservable(companionDocs$, INITIAL_COMPANION_DOCS)

  const companionDoc = useMemo(
    () => companionDocs.data.find((companion) => companion?.studioDocumentId === documentId),
    [companionDocs, documentId],
  )
  return {
    isLinked: Boolean(companionDoc),
    isLockedByCanvas: companionDoc ? !companionDoc.isStudioDocumentEditable : false,
    companionDoc,
    loading: companionDocs.loading,
  }
}

import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {getPublishedId} from '../../util/draftUtils'
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
  // Deferred (per review): the companion docs stream is keyed on the stable
  // published id, and the `<DocumentPaneProvider>` remount on navigation
  // resets this state, so there's no cross-document tear. react-rx v5's
  // identity-coherent deferral additionally falls back to the live value if
  // the observable identity ever changes.
  const companionDocs = useObservable(companionDocs$, undefined)

  const companionDoc = useMemo(
    () => companionDocs?.data.find((companion) => companion?.studioDocumentId === documentId),
    [companionDocs, documentId],
  )
  return {
    isLinked: Boolean(companionDoc),
    isLockedByCanvas: companionDoc ? !companionDoc.isStudioDocumentEditable : false,
    companionDoc,
    loading: companionDocs?.loading,
  }
}

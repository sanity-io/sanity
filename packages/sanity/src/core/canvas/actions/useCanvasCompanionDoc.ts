import {getPublishedId} from '../../util/draftUtils'
import {useCanvasCompanionDocsStore} from '../store/useCanvasCompanionDocsStore'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

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
  const companionDocs = useObservable(companionDocs$)

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

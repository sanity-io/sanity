import {useMemo} from 'react'

import {usePerspective} from '../../perspective/usePerspective'
import {getDraftId, getPublishedId, getVersionId} from '../../util/draftUtils'
import {useCanvasContext} from '../CanvasDocumentLayout'

export const useCompanionDoc = (documentId: string) => {
  const {companionDocs} = useCanvasContext()
  const {selectedPerspectiveName} = usePerspective()

  const perspectiveDocumentId = useMemo(() => {
    if (!selectedPerspectiveName) return getDraftId(documentId)
    if (selectedPerspectiveName === 'published') return getPublishedId(documentId)
    return getVersionId(documentId, selectedPerspectiveName)
  }, [documentId, selectedPerspectiveName])

  const companionDoc = companionDocs.data.find(
    (companion) => companion?.studioDocumentId === perspectiveDocumentId,
  )

  return {isLinked: Boolean(companionDoc), companionDoc, loading: companionDocs.loading}
}

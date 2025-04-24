import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {usePerspective} from '../../perspective/usePerspective'
import {getDraftId, getPublishedId, getVersionId} from '../../util/draftUtils'
import {useCompanionDocsStore} from '../store/useCompanionDocsStore'

/**
 * Given a document id, returns whether it is linked to canvas and the companion doc if it exists.
 * @beta
 */
export const useCompanionDoc = (documentId: string) => {
  const {selectedPerspectiveName} = usePerspective()
  const companionDocsStore = useCompanionDocsStore()
  const publishedId = getPublishedId(documentId)
  const companionDocs$ = useMemo(
    () => companionDocsStore.getCompanionDocs(publishedId),
    [publishedId, companionDocsStore],
  )
  const companionDocs = useObservable(companionDocs$)
  const perspectiveDocumentId = useMemo(() => {
    if (!selectedPerspectiveName) return getDraftId(documentId)
    if (selectedPerspectiveName === 'published') return getPublishedId(documentId)
    return getVersionId(documentId, selectedPerspectiveName)
  }, [documentId, selectedPerspectiveName])

  const companionDoc = useMemo(
    () =>
      companionDocs?.data.find(
        (companion) => companion?.studioDocumentId === perspectiveDocumentId,
      ),
    [companionDocs, perspectiveDocumentId],
  )
  return {isLinked: Boolean(companionDoc), companionDoc, loading: companionDocs?.loading}
}

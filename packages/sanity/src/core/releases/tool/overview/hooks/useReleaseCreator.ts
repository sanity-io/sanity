import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useReleaseHistory} from '../../detail/documentTable/useReleaseHistory'

/**
 * @internal
 */
export function useReleaseCreator(
  releaseDocumentId: string | undefined,
  isLoading: boolean = false,
): {
  createdBy: string | undefined
  loading: boolean
} {
  const releaseId =
    releaseDocumentId && !isLoading ? getReleaseIdFromReleaseDocumentId(releaseDocumentId) : ''

  const {firstDocument, loading: documentsLoading} = useScheduledDraftDocument(releaseDocumentId)
  const {documentHistory, loading: historyLoading} = useReleaseHistory(
    firstDocument?._id,
    releaseId,
  )

  if (!releaseDocumentId || isLoading) {
    return {createdBy: undefined, loading: false}
  }

  if (documentsLoading || historyLoading) {
    return {createdBy: undefined, loading: true}
  }

  return {
    createdBy: documentHistory?.createdBy,
    loading: false,
  }
}

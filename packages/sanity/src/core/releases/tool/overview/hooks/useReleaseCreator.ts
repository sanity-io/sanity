import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useReleaseHistory} from '../../detail/documentTable/useReleaseHistory'
import {useBundleDocuments} from '../../detail/useBundleDocuments'

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

  const {results: documents, loading: documentsLoading} = useBundleDocuments(releaseId)
  const firstDocumentId = documents?.[0]?.document?._id
  const {documentHistory, loading: historyLoading} = useReleaseHistory(firstDocumentId, releaseId)

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

import {type SanityDocument} from '@sanity/client'

import {useBundleDocuments} from '../tool/detail/useBundleDocuments'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

/**
 * Hook to get the first document from a scheduled draft release bundle.
 * This abstracts the common pattern of accessing `documents?.[0]?.document`.
 *
 * @param releaseDocumentId - The release document ID (e.g., "releases.abc123")
 * @returns Object containing the first document, document count, loading state, and error
 * @internal
 */
export function useScheduledDraftDocument(releaseDocumentId: string | undefined): {
  firstDocument: SanityDocument | undefined
  documentsCount: number
  loading: boolean
  error: Error | null
} {
  const releaseId = releaseDocumentId ? getReleaseIdFromReleaseDocumentId(releaseDocumentId) : ''
  const {results: documents, loading, error} = useBundleDocuments(releaseId)

  const firstDocument = documents?.[0]?.document
  const documentsCount = documents?.length || 0

  return {
    firstDocument,
    documentsCount,
    loading,
    error,
  }
}

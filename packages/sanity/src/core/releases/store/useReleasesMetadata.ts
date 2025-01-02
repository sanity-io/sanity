import {useEffect, useState} from 'react'

import {useReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'

export interface ReleasesMetadata {
  /**
   * The number of documents with the release version as a prefix
   */
  documentCount: number
  /**
   * The number of subset documents with the release version as a prefix
   * that are already published
   */
  existingDocumentCount: number
  /**
   * The last time a document in the release was edited
   */
  updatedAt: string | null
}

export const useReleasesMetadata = (releaseIds: string[]) => {
  const {addReleaseIdsToListener, removeReleaseIdsFromListener, state} =
    useReleasesMetadataProvider()
  const [responseData, setResponseData] = useState<Record<string, ReleasesMetadata> | null>(null)

  useEffect(() => {
    if (releaseIds.length) addReleaseIdsToListener([...new Set(releaseIds)])

    return () => removeReleaseIdsFromListener([...new Set(releaseIds)])
  }, [addReleaseIdsToListener, releaseIds, removeReleaseIdsFromListener])

  const {data, loading} = state

  useEffect(() => {
    if (!data) return

    const hasUpdatedMetadata =
      !responseData || Object.entries(responseData).some(([key, value]) => value !== data[key])

    if (hasUpdatedMetadata) {
      const nextResponseData = Object.fromEntries(
        releaseIds.map((releaseId) => [releaseId, data[releaseId]]),
      )

      setResponseData(nextResponseData)
    }
  }, [releaseIds, data, responseData])

  return {
    error: state.error,
    // loading is only for initial load
    // changing listened to release IDs will not cause a re-load
    loading,
    data: responseData,
  }
}

import {useEffect, useState} from 'react'

import {useBundlesMetadataProvider} from '../../releases/contexts/ReleasesMetadataProvider'

export interface ReleasesMetadata {
  /**
   * The number of documents with the bundle version as a prefix
   */
  documentCount: number
  /**
   * The last time a document in the bundle was edited
   */
  updatedAt: string | null
}

export const useReleasesMetadata = (releaseIds: string[]) => {
  const {addBundleIdsToListener, removeBundleIdsFromListener, state} = useBundlesMetadataProvider()
  const [responseData, setResponseData] = useState<Record<string, ReleasesMetadata> | null>(null)

  useEffect(() => {
    if (releaseIds.length) addBundleIdsToListener([...new Set(releaseIds)])

    return () => removeBundleIdsFromListener([...new Set(releaseIds)])
  }, [addBundleIdsToListener, releaseIds, removeBundleIdsFromListener])

  const {data, loading} = state

  useEffect(() => {
    if (!data) return

    const hasUpdatedMetadata =
      !responseData || Object.entries(responseData).some(([key, value]) => value !== data[key])

    if (hasUpdatedMetadata) {
      const nextResponseData = Object.fromEntries(
        releaseIds.map((bundleId) => [bundleId, data[bundleId]]),
      )

      setResponseData(nextResponseData)
    }
  }, [releaseIds, data, responseData])

  return {
    error: state.error,
    // loading is only for initial load
    // changing listened to bundle slugs will not cause a re-load
    loading,
    data: responseData,
  }
}

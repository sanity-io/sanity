import {useEffect, useState} from 'react'

import {useBundlesMetadataProvider} from '../contexts/BundlesMetadataProvider'

export interface BundlesMetadata {
  /**
   * The number of documents with the bundle version as a prefix
   */
  documentCount: number
  /**
   * The last time a document in the bundle was edited
   */
  updatedAt: string | null
}

export const useBundlesMetadata = (bundleIds: string[]) => {
  const {addBundleIdsToListener, removeBundleIdsFromListener, state} = useBundlesMetadataProvider()
  const [responseData, setResponseData] = useState<Record<string, BundlesMetadata> | null>(null)

  useEffect(() => {
    if (bundleIds.length) addBundleIdsToListener([...new Set(bundleIds)])

    return () => removeBundleIdsFromListener([...new Set(bundleIds)])
  }, [addBundleIdsToListener, bundleIds, removeBundleIdsFromListener])

  const {data, loading} = state

  useEffect(() => {
    if (!data) return

    const hasUpdatedMetadata =
      !responseData || Object.entries(responseData).some(([key, value]) => value !== data[key])

    if (hasUpdatedMetadata) {
      const nextResponseData = Object.fromEntries(
        bundleIds.map((bundleId) => [bundleId, data[bundleId]]),
      )

      setResponseData(nextResponseData)
    }
  }, [bundleIds, data, responseData])

  return {
    error: state.error,
    // loading is only for initial load
    // changing listened to bundle slugs will not cause a re-load
    loading,
    data: responseData,
  }
}

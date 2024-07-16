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

export const useBundlesMetadata = (bundleSlugs: string[]) => {
  const {addBundleSlugsToListener, removeBundleSlugsFromListener, state} =
    useBundlesMetadataProvider()
  const [responseData, setResponseData] = useState<Record<string, BundlesMetadata> | null>(null)

  useEffect(() => {
    addBundleSlugsToListener([...new Set(bundleSlugs)])

    return () => removeBundleSlugsFromListener([...new Set(bundleSlugs)])
  }, [addBundleSlugsToListener, bundleSlugs, removeBundleSlugsFromListener])

  const {data} = state

  useEffect(() => {
    if (!data) return

    const hasUpdatedMetadata =
      !responseData || Object.entries(responseData).some(([key, value]) => value !== data[key])

    if (hasUpdatedMetadata) {
      const nextResponseData = Object.fromEntries(bundleSlugs.map((slug) => [slug, data[slug]]))

      setResponseData(nextResponseData)
    }
  }, [bundleSlugs, data, responseData])

  return {
    error: state.error,
    // loading is only for initial load
    // changing listened to bundle slugs will not cause a re-load
    loading: !responseData,
    // fetching is true when performing initial load for a given set of bundle metadata
    // changing listened to bundle slugs will cause a re-fetch
    fetching: state.loading,
    data: responseData,
  }
}

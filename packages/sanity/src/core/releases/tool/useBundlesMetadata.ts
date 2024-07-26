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
    if (bundleSlugs.length) addBundleSlugsToListener([...new Set(bundleSlugs)])

    return () => removeBundleSlugsFromListener([...new Set(bundleSlugs)])
  }, [addBundleSlugsToListener, bundleSlugs, removeBundleSlugsFromListener])

  const {data, loading} = state

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
    loading,
    data: responseData,
  }
}

import {useEffect, useState} from 'react'

import {useBundlesMetadataProvider} from '../contexts/BundlesMetadataProvider'

export type BundlesMetadata = {matches: number; lastEdited: string}

export type BundlesMetadataMap = Record<string, BundlesMetadata>

export const useBundlesMetadata = (bundlesIds: string[]) => {
  const {addBundleIds, removeBundleIds, state} = useBundlesMetadataProvider()
  const [responseData, setResponseData] = useState<Record<string, BundlesMetadata> | null>(null)

  useEffect(() => {
    addBundleIds([...new Set(bundlesIds)])

    return () => removeBundleIds([...new Set(bundlesIds)])
  }, [addBundleIds, bundlesIds, removeBundleIds])

  const {data} = state || {}

  useEffect(() => {
    if (!data) return
    const hasUpdatedMetadata =
      !responseData || Object.entries(responseData).some(([key, value]) => value !== data[key])

    if (hasUpdatedMetadata) {
      const nextResponseData = Object.fromEntries(
        bundlesIds.map((bundleId) => [bundleId, data[bundleId]]),
      )

      setResponseData(nextResponseData)
    }
  }, [bundlesIds, data, responseData, state.data])

  return {
    error: state.error,
    // loading is only for initial load
    // changing bundleIds will not cause a re-load
    loading: !state.data,
    // fetching is true when performing initial load for a given set of bundle metadata
    // changing bundleIds will cause a re-fetch
    fetching: state.loading,
    data: responseData,
  }
}

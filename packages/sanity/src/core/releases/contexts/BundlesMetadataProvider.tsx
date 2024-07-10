import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {useBundlesStore} from 'sanity'

import {
  BundlesMetadataContext,
  DEFAULT_METADATA_STATE,
} from '../../../_singletons/core/releases/BundlesMetadataContext'
import {type MetadataWrapper} from '../../store/bundles/createBundlesStore'
import {type BundlesMetadata} from '../tool/useBundlesMetadata'

export const BundlesMetadataProvider = ({children}: {children: React.ReactNode}) => {
  const [bundleIds, setBundleIds] = useState<string[]>([])
  const {aggState$: metadataState$} = useBundlesStore()
  const [bundlesMetadata, setBundlesMetadata] = useState<Record<string, BundlesMetadata> | null>(
    null,
  )

  const memoObservable = useMemo(() => metadataState$(bundleIds), [metadataState$, bundleIds])

  const observedResult = useObservable(memoObservable) || DEFAULT_METADATA_STATE

  // patch metadata in local state
  useEffect(
    () => setBundlesMetadata((prev) => ({...prev, ...observedResult.data})),
    [observedResult.data],
  )

  const addBundleIds = useCallback((ids: string[]) => {
    setBundleIds((prev) => [...prev, ...ids])
  }, [])

  const removeBundleIds = useCallback((ids: string[]) => {
    setBundleIds((prev) => prev.filter((id) => !ids.includes(id)))
  }, [])

  const context = useMemo<{
    addBundleIds: (ids: string[]) => void
    removeBundleIds: (ids: string[]) => void
    state: MetadataWrapper
  }>(
    () => ({
      addBundleIds,
      removeBundleIds,
      state: {...observedResult, data: bundlesMetadata},
    }),
    [addBundleIds, bundlesMetadata, observedResult, removeBundleIds],
  )

  return (
    <BundlesMetadataContext.Provider value={context}>{children}</BundlesMetadataContext.Provider>
  )
}

export const useBundlesMetadataProvider = () => {
  const contextValue = useContext(BundlesMetadataContext)

  return contextValue
}

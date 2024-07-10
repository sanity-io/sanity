import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {useBundlesStore} from 'sanity'
import {BundlesMetadataContext, DEFAULT_METADATA_STATE} from 'sanity/_singletons'

import {type MetadataWrapper} from '../../store/bundles/createBundlesMetadataAggregator'
import {type BundlesMetadata} from '../tool/useBundlesMetadata'

const BundlesMetadataProviderInner = ({children}: {children: React.ReactNode}) => {
  const [listenerBundleSlugs, setListenerBundleSlugs] = useState<string[]>([])
  const {getMetadataStateForSlugs$} = useBundlesStore()
  const [bundlesMetadata, setBundlesMetadata] = useState<Record<string, BundlesMetadata> | null>(
    null,
  )

  const memoObservable = useMemo(
    () => getMetadataStateForSlugs$(listenerBundleSlugs),
    [getMetadataStateForSlugs$, listenerBundleSlugs],
  )

  const observedResult = useObservable(memoObservable) || DEFAULT_METADATA_STATE

  // patch metadata in local state
  useEffect(
    () =>
      setBundlesMetadata((prevBundleMetadata) => {
        if (!observedResult.data) return prevBundleMetadata

        return {...(prevBundleMetadata || {}), ...observedResult.data}
      }),
    [observedResult.data],
  )

  const addBundleSlugsToListener = useCallback((addBundleSlugs: string[]) => {
    setListenerBundleSlugs((prevSlugs) => [...prevSlugs, ...addBundleSlugs])
  }, [])

  const removeBundleSlugsFromListener = useCallback((removeBundleSlugs: string[]) => {
    setListenerBundleSlugs((prevSlugs) =>
      prevSlugs.filter((listenerBundleSlug) => !removeBundleSlugs.includes(listenerBundleSlug)),
    )
  }, [])

  const context = useMemo<{
    addBundleSlugsToListener: (slugs: string[]) => void
    removeBundleSlugsFromListener: (slugs: string[]) => void
    state: MetadataWrapper
  }>(
    () => ({
      addBundleSlugsToListener,
      removeBundleSlugsFromListener,
      state: {...observedResult, data: bundlesMetadata},
    }),
    [addBundleSlugsToListener, bundlesMetadata, observedResult, removeBundleSlugsFromListener],
  )

  return (
    <BundlesMetadataContext.Provider value={context}>{children}</BundlesMetadataContext.Provider>
  )
}

export const BundlesMetadataProvider = ({children}: {children: React.ReactNode}) => {
  const context = useContext(BundlesMetadataContext)

  // Avoid mounting the provider if it's already provided by a parent
  if (context) return children
  return <BundlesMetadataProviderInner>{children}</BundlesMetadataProviderInner>
}

export const useBundlesMetadataProvider = () => {
  const contextValue = useContext(BundlesMetadataContext)

  return (
    contextValue || {
      state: DEFAULT_METADATA_STATE,
      addBundleSlugsToListener: () => null,
      removeBundleSlugsFromListener: () => null,
    }
  )
}

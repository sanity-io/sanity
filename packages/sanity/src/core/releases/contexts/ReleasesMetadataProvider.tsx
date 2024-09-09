import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {useBundlesStore} from 'sanity'
import {ReleasesMetadataContext} from 'sanity/_singletons'

import {type MetadataWrapper} from '../../store/bundles/createBundlesMetadataAggregator'
import {type BundlesMetadata} from '../tool/useBundlesMetadata'

/**
 * @internal
 */
export interface ReleasesMetadataContextValue {
  state: MetadataWrapper
  addBundleIdsToListener: (slugs: string[]) => void
  removeBundleIdsFromListener: (slugs: string[]) => void
}

const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

const BundlesMetadataProviderInner = ({children}: {children: React.ReactNode}) => {
  const [listenerBundleIds, setListenerBundleIds] = useState<string[]>([])
  const {getMetadataStateForSlugs$} = useBundlesStore()
  const [bundlesMetadata, setBundlesMetadata] = useState<Record<string, BundlesMetadata> | null>(
    null,
  )

  const memoObservable = useMemo(
    () => getMetadataStateForSlugs$(listenerBundleIds),
    [getMetadataStateForSlugs$, listenerBundleIds],
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

  const addBundleIdsToListener = useCallback((addBundleIds: (string | undefined)[]) => {
    setListenerBundleIds((prevSlugs) => [
      ...prevSlugs,
      ...addBundleIds.filter((bundleId): bundleId is string => typeof bundleId === 'string'),
    ])
  }, [])

  const removeBundleIdsFromListener = useCallback((bundleIds: string[]) => {
    setListenerBundleIds((prevSlugs) => {
      const {nextSlugs} = prevSlugs.reduce<{removedSlugs: string[]; nextSlugs: string[]}>(
        (acc, slug) => {
          const {removedSlugs, nextSlugs: accNextSlugs} = acc
          /**
           * In cases where multiple consumers are listening to the same bundle id
           * the bundle id will appear multiple times in listenerBundleIds array
           * removing should only remove 1 instance of the slug and retain all others
           */
          if (bundleIds.includes(slug) && !removedSlugs.includes(slug)) {
            return {removedSlugs: [...removedSlugs, slug], nextSlugs: accNextSlugs}
          }
          return {removedSlugs, nextSlugs: [...accNextSlugs, slug]}
        },
        {removedSlugs: [], nextSlugs: []},
      )
      return nextSlugs
    })
  }, [])

  const context = useMemo<{
    addBundleIdsToListener: (slugs: string[]) => void
    removeBundleIdsFromListener: (slugs: string[]) => void
    state: MetadataWrapper
  }>(
    () => ({
      addBundleIdsToListener: addBundleIdsToListener,
      removeBundleIdsFromListener: removeBundleIdsFromListener,
      state: {...observedResult, data: bundlesMetadata},
    }),
    [addBundleIdsToListener, bundlesMetadata, observedResult, removeBundleIdsFromListener],
  )

  return (
    <ReleasesMetadataContext.Provider value={context}>{children}</ReleasesMetadataContext.Provider>
  )
}

export const BundlesMetadataProvider = ({children}: {children: React.ReactNode}) => {
  const context = useContext(ReleasesMetadataContext)

  // Avoid mounting the provider if it's already provided by a parent
  if (context) return children
  return <BundlesMetadataProviderInner>{children}</BundlesMetadataProviderInner>
}

export const useBundlesMetadataProvider = (): ReleasesMetadataContextValue => {
  const contextValue = useContext(ReleasesMetadataContext)

  return (
    contextValue || {
      state: DEFAULT_METADATA_STATE,
      addBundleIdsToListener: () => null,
      removeBundleIdsFromListener: () => null,
    }
  )
}

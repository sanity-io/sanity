import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {ReleasesMetadataContext} from 'sanity/_singletons'

import {type MetadataWrapper} from '../store/createReleaseMetadataAggregator'
import {type ReleasesMetadata} from '../store/useReleasesMetadata'
import {useReleasesStore} from '../store/useReleasesStore'

/**
 * @internal
 */
export interface ReleasesMetadataContextValue {
  state: MetadataWrapper
  addReleaseIdsToListener: (slugs: string[]) => void
  removeReleaseIdsFromListener: (slugs: string[]) => void
}

const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

const ReleasesMetadataProviderInner = ({children}: {children: React.ReactNode}) => {
  const [listenerReleaseIds, setListenerReleaseIds] = useState<string[]>([])
  const {getMetadataStateForSlugs$} = useReleasesStore()
  const [releasesMetadata, setReleasesMetadata] = useState<Record<string, ReleasesMetadata> | null>(
    null,
  )

  const memoObservable = useMemo(
    () => getMetadataStateForSlugs$(listenerReleaseIds.map((slug) => slug)),
    [getMetadataStateForSlugs$, listenerReleaseIds],
  )

  const observedResult = useObservable(memoObservable) || DEFAULT_METADATA_STATE

  // patch metadata in local state
  useEffect(
    () =>
      setReleasesMetadata((prevReleaseMetadata) => {
        if (!observedResult.data) return prevReleaseMetadata

        return {...(prevReleaseMetadata || {}), ...observedResult.data}
      }),
    [observedResult.data],
  )

  const addReleaseIdsToListener = useCallback((addReleaseIds: (string | undefined)[]) => {
    setListenerReleaseIds((prevSlugs) => [
      ...prevSlugs,
      ...addReleaseIds.filter((releaseId): releaseId is string => typeof releaseId === 'string'),
    ])
  }, [])

  const removeReleaseIdsFromListener = useCallback((releaseIds: string[]) => {
    setListenerReleaseIds((prevSlugs) => {
      const {nextSlugs} = prevSlugs.reduce<{removedSlugs: string[]; nextSlugs: string[]}>(
        (acc, slug) => {
          const {removedSlugs, nextSlugs: accNextSlugs} = acc
          /**
           * In cases where multiple consumers are listening to the same release id
           * the release id will appear multiple times in listenerReleaseIds array
           * removing should only remove 1 instance of the slug and retain all others
           */
          if (releaseIds.includes(slug) && !removedSlugs.includes(slug)) {
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
    addReleaseIdsToListener: (slugs: string[]) => void
    removeReleaseIdsFromListener: (slugs: string[]) => void
    state: MetadataWrapper
  }>(
    () => ({
      addReleaseIdsToListener: addReleaseIdsToListener,
      removeReleaseIdsFromListener: removeReleaseIdsFromListener,
      state: {...observedResult, data: releasesMetadata},
    }),
    [addReleaseIdsToListener, releasesMetadata, observedResult, removeReleaseIdsFromListener],
  )

  return (
    <ReleasesMetadataContext.Provider value={context}>{children}</ReleasesMetadataContext.Provider>
  )
}

export const ReleasesMetadataProvider = ({children}: {children: React.ReactNode}) => {
  const context = useContext(ReleasesMetadataContext)

  // Avoid mounting the provider if it's already provided by a parent
  if (context) return children
  return <ReleasesMetadataProviderInner>{children}</ReleasesMetadataProviderInner>
}

export const useReleasesMetadataProvider = (): ReleasesMetadataContextValue => {
  const contextValue = useContext(ReleasesMetadataContext)

  return (
    contextValue || {
      state: DEFAULT_METADATA_STATE,
      addReleaseIdsToListener: () => null,
      removeReleaseIdsFromListener: () => null,
    }
  )
}

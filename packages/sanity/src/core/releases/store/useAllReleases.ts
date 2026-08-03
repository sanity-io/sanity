import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {useReleasesStore} from './useReleasesStore'

/**
 * Gets all releases including archived and published releases
 * @internal
 */
export function useAllReleases(): {
  data: ReleaseDocument[]
  error?: Error
  loading: boolean
  map: Map<string, ReleaseDocument>
} {
  const {state$} = useReleasesStore()
  // Kept synchronous: release lists feed perspective/version identity
  // resolution alongside live perspective state, so a deferred snapshot could
  // pair a stale release list with the current selection — or disagree with
  // the synchronous `useActiveReleases` read of the same store. Executable
  // proof: perspective/__tests__/deferralSafety.test.tsx.
  const {releases, error, state} = useSyncObservable(state$)!

  return useMemo(
    () => ({
      data: sortReleases(Array.from(releases.values())),
      map: releases,
      error: error,
      loading: ['loading', 'initialising'].includes(state),
    }),
    [error, releases, state],
  )
}

import {useObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {type ReleaseDocument} from './types'
import {useReleasesStore} from './useReleasesStore'

/**
 * Gets all releases including archived releases
 * @internal
 */
export function useAllReleases(): {
  allReleases: ReleaseDocument[]
} {
  const {state$} = useReleasesStore()
  const state = useObservable(state$)!

  return {
    allReleases: sortReleases(Array.from(state.releases.values())),
  }
}

import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {type TargetPerspective} from '../perspective/types'
import {type ReleasesReducerState} from '../releases/store/reducer'
import {useReleasesStore} from '../releases/store/useReleasesStore'
import {resolveVersionRelease, type VersionReleaseDocument} from './resolveVersionRelease'

type Result = Pick<ReleasesReducerState, 'error' | 'state'> & {
  release: TargetPerspective | undefined
}

/**
 * Determine the `TargetPerspective` (a release or variant name) that
 * corresponds with the provided document by inspecting its `_system` metadata.
 *
 * @internal
 */
export function useVersionRelease(document: VersionReleaseDocument | undefined): Result {
  const {state$: readReleasesState} = useReleasesStore()

  const releasesState = useObservable<Observable<ReleasesReducerState>>(readReleasesState, {
    releases: new Map(),
    state: 'initialising',
  })

  return resolveVersionRelease(document, releasesState)
}

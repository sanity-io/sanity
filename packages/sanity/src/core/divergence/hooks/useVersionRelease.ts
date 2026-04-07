import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {type TargetPerspective} from '../../perspective/types'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVersionFromId} from '../../util/draftUtils'

type Result = Pick<ReleasesReducerState, 'error' | 'state'> & {
  release: TargetPerspective | undefined
}

/**
 * @internal
 */
export function useVersionRelease(documentId: string | undefined): Result {
  const {state$: readReleasesState} = useReleasesStore()

  const releasesState = useObservable<Observable<ReleasesReducerState>>(readReleasesState, {
    releases: new Map(),
    state: 'initialising',
  })

  if (typeof documentId === 'undefined') {
    return {
      release: undefined,
      state: 'initialising',
    }
  }

  const versionId = getVersionFromId(documentId)

  if (typeof versionId === 'undefined') {
    return {
      release: 'published',
      state: 'loaded',
    }
  }

  return {
    ...releasesState,
    release: releasesState?.releases.get(getReleaseDocumentIdFromReleaseId(versionId)),
  }
}

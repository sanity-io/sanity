import {useSyncObservable} from 'react-rx'

import {type TargetPerspective} from '../perspective/types'
import {INITIAL_RELEASES_STATE} from '../releases/store/createReleaseStore'
import {type ReleasesReducerState} from '../releases/store/reducer'
import {useReleasesStore} from '../releases/store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVersionFromId, isDraftId} from '../util/draftUtils'

type Result = Pick<ReleasesReducerState, 'error' | 'state'> & {
  release: TargetPerspective | undefined
}

/**
 * Determine the `TargetPerspective` (a release or variant name) that
 * corresponds with the provided document id by looking for its owner in the
 * known list of releases.
 *
 * @internal
 */
export function useVersionRelease(documentId: string | undefined): Result {
  const {state$: readReleasesState} = useReleasesStore()

  const releasesState = useSyncObservable(readReleasesState, INITIAL_RELEASES_STATE)

  if (typeof documentId === 'undefined') {
    return {
      release: undefined,
      state: 'initialising',
    }
  }

  const versionId = getVersionFromId(documentId)

  if (typeof versionId === 'undefined') {
    return {
      release: isDraftId(documentId) ? 'drafts' : 'published',
      state: 'loaded',
    }
  }

  // `release` falls back to the version id if the version is a member of an anonymous bundle.
  return {
    ...releasesState,
    release: releasesState?.releases.get(getReleaseDocumentIdFromReleaseId(versionId)) ?? versionId,
  }
}

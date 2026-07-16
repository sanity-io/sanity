import {type DocumentSystem, type SanityDocumentLike} from '@sanity/types'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {type TargetPerspective} from '../perspective/types'
import {type ReleasesReducerState} from '../releases/store/reducer'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {useReleasesStore} from '../releases/store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVersionFromId, isDraftId} from '../util/draftUtils'
import {readVersionType} from '../util/versionsUtils'

type Result = Pick<ReleasesReducerState, 'error' | 'state'> & {
  release: TargetPerspective | undefined
}

/**
 * @internal
 */
export type VersionReleaseDocument = Pick<SanityDocumentLike, '_id'> & {
  _system?: Partial<DocumentSystem>
}

/**
 * Determine the `TargetPerspective` (a release or variant name) that
 * corresponds with the provided document by inspecting its `_system` metadata.
 *
 * Falls back to id-based classification for documents without `_system`.
 *
 * @internal
 */
export function resolveVersionRelease(
  document: VersionReleaseDocument | undefined,
  releasesState: ReleasesReducerState,
): Result {
  if (typeof document === 'undefined') {
    return {
      release: undefined,
      state: 'initialising',
    }
  }

  if (document._system) {
    const versionType = readVersionType(document as VersionInfoDocumentStub)

    switch (versionType) {
      case 'draft':
        return {
          ...releasesState,
          release: 'drafts',
          state: 'loaded',
        }
      case 'published':
        return {
          ...releasesState,
          release: 'published',
          state: 'loaded',
        }
      case 'release': {
        const releaseRef = document._system.release?._ref
        return {
          ...releasesState,
          release: releaseRef ? (releasesState.releases.get(releaseRef) ?? releaseRef) : undefined,
          state: 'loaded',
        }
      }
      case 'agent': {
        const versionId = getVersionFromId(document._id)
        return {
          ...releasesState,
          release:
            typeof versionId === 'undefined'
              ? undefined
              : (releasesState.releases.get(getReleaseDocumentIdFromReleaseId(versionId)) ??
                versionId),
          state: 'loaded',
        }
      }
      default:
        break
    }
  }

  const versionId = getVersionFromId(document._id)

  if (typeof versionId === 'undefined') {
    return {
      release: isDraftId(document._id) ? 'drafts' : 'published',
      state: 'loaded',
    }
  }

  // `release` falls back to the version id if the version is a member of an anonymous bundle.
  return {
    ...releasesState,
    release: releasesState.releases.get(getReleaseDocumentIdFromReleaseId(versionId)) ?? versionId,
  }
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

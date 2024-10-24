import {DRAFTS_FOLDER, resolveBundlePerspective} from 'sanity'

import {type ReleaseDocument} from './types'

interface BundleDeletedAction {
  id: string
  currentUserId?: string
  deletedByUserId: string
  type: 'BUNDLE_DELETED'
}

interface BundleUpdatedAction {
  payload: ReleaseDocument
  type: 'BUNDLE_UPDATED'
}

interface ReleasesSetAction {
  payload: ReleaseDocument[] | null
  type: 'RELEASES_SET'
}

interface BundleReceivedAction {
  payload: ReleaseDocument
  type: 'BUNDLE_RECEIVED'
}

interface LoadingStateChangedAction {
  payload: {
    loading: boolean
    error: Error | undefined
  }
  type: 'LOADING_STATE_CHANGED'
}

export type ReleasesReducerAction =
  | BundleDeletedAction
  | BundleUpdatedAction
  | ReleasesSetAction
  | BundleReceivedAction
  | LoadingStateChangedAction

export interface ReleasesReducerState {
  releases: Map<string, ReleaseDocument>
  deletedReleases: Record<string, ReleaseDocument>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error

  /**
   * An array of release ids ordered chronologically to represent the state of documents at the
   * given point in time.
   */
  releaseStack: string[]
}

function createReleasesSet(releases: ReleaseDocument[] | null) {
  return (releases ?? []).reduce((acc, bundle) => {
    acc.set(bundle._id, bundle)
    return acc
  }, new Map<string, ReleaseDocument>())
}

export function releasesReducer(
  state: ReleasesReducerState,
  action: ReleasesReducerAction,
  perspective?: string,
): ReleasesReducerState {
  switch (action.type) {
    case 'LOADING_STATE_CHANGED': {
      return {
        ...state,
        state: action.payload.loading ? 'loading' : 'loaded',
        error: action.payload.error,
      }
    }

    case 'RELEASES_SET': {
      // Create an object with the BUNDLE id as key
      const releasesById = createReleasesSet(action.payload)

      return {
        ...state,
        releases: releasesById,
        releaseStack: getReleaseStack({
          releases: releasesById,
          perspective,
        }),
      }
    }

    case 'BUNDLE_RECEIVED': {
      const receivedBundle = action.payload as ReleaseDocument
      const currentReleases = new Map(state.releases)
      currentReleases.set(receivedBundle._id, receivedBundle)

      return {
        ...state,
        releases: currentReleases,
        releaseStack: getReleaseStack({
          releases: currentReleases,
          perspective,
        }),
      }
    }

    case 'BUNDLE_DELETED': {
      const currentReleases = new Map(state.releases)
      const deletedBundleId = action.id
      const isDeletedByCurrentUser = action.currentUserId === action.deletedByUserId
      const localDeletedBundle = currentReleases.get(deletedBundleId)
      currentReleases.delete(deletedBundleId)

      // only capture the deleted release if deleted by another user
      const nextDeletedReleases =
        !isDeletedByCurrentUser && localDeletedBundle
          ? {
              ...state.deletedReleases,
              [localDeletedBundle._id]: localDeletedBundle,
            }
          : state.deletedReleases

      return {
        ...state,
        releases: currentReleases,
        deletedReleases: nextDeletedReleases,
        releaseStack: [...state.releaseStack].filter((id) => id !== deletedBundleId),
      }
    }

    case 'BUNDLE_UPDATED': {
      const updatedBundle = action.payload
      const id = updatedBundle._id as string
      const currentReleases = new Map(state.releases)
      currentReleases.set(id, updatedBundle)

      return {
        ...state,
        releases: currentReleases,
        releaseStack: getReleaseStack({
          releases: currentReleases,
          perspective,
        }),
      }
    }

    default:
      return state
  }
}

function getReleaseStack({
  releases,
  perspective,
}: {
  releases?: Map<string, ReleaseDocument>
  perspective?: string
}): string[] {
  if (typeof releases === 'undefined') {
    return []
  }

  // TODO: Handle system perspectives.
  if (!perspective?.startsWith('bundle.')) {
    return []
  }

  const stack = [...releases.values()]
    .toSorted(sortReleases(resolveBundlePerspective(perspective)))
    .map(({_id}) => _id)
    .concat(DRAFTS_FOLDER)

  return stack
}

// TODO: Implement complete layering heuristics.
function sortReleases(perspective?: string): (a: ReleaseDocument, b: ReleaseDocument) => number {
  return function (a, b) {
    // Ensure the current release takes highest precedence.
    if (getBundleIdFromReleaseId(a._id) === perspective) {
      return -1
    }
    return 0
  }
}

import {type BundleDocument} from './types'

interface BundleDeletedAction {
  id: string
  currentUserId?: string
  deletedByUserId: string
  type: 'BUNDLE_DELETED'
}

interface BundleUpdatedAction {
  payload: BundleDocument
  type: 'BUNDLE_UPDATED'
}

interface ReleasesSetAction {
  payload: BundleDocument[] | null
  type: 'RELEASES_SET'
}

interface BundleReceivedAction {
  payload: BundleDocument
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
  releases: Map<string, BundleDocument>
  deletedReleases: Record<string, BundleDocument>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error
}

function createReleasesSet(releases: BundleDocument[] | null) {
  return (releases ?? []).reduce((acc, bundle) => {
    acc.set(bundle._id, bundle)
    return acc
  }, new Map<string, BundleDocument>())
}

export function releasesReducer(
  state: ReleasesReducerState,
  action: ReleasesReducerAction,
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
      }
    }

    case 'BUNDLE_RECEIVED': {
      const receivedBundle = action.payload as BundleDocument
      const currentReleases = new Map(state.releases)
      currentReleases.set(receivedBundle._id, receivedBundle)

      return {
        ...state,
        releases: currentReleases,
      }
    }

    case 'BUNDLE_DELETED': {
      const currentReleases = new Map(state.releases)
      const deletedBundleId = action.id
      const isDeletedByCurrentUser = action.currentUserId === action.deletedByUserId
      const localDeletedBundle = currentReleases.get(deletedBundleId)
      currentReleases.delete(deletedBundleId)

      // only capture the deleted bundle if deleted by another user
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
      }
    }

    default:
      return state
  }
}

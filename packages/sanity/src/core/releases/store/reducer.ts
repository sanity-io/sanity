import {type ReleaseDocument} from './types'

interface BundleDeletedAction {
  id: string
  currentUserId?: string
  deletedByUserId: string
  type: 'BUNDLE_DELETED'
}

interface ReleasesSetAction {
  payload: ReleaseDocument[] | null
  type: 'RELEASES_SET'
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
  | ReleasesSetAction
  | LoadingStateChangedAction

export interface ReleasesReducerState {
  releases: Map<string, ReleaseDocument>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error
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

    default:
      return state
  }
}

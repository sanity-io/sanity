import {type ReleaseDocument} from '@sanity/client'

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

      // Maintain a stable value when the release content is unchanged, allowing
      // the value to be safely memoized by consumers.
      if (releasesAreEqual(state.releases, releasesById)) {
        return state
      }

      return {
        ...state,
        releases: releasesById,
      }
    }

    default:
      return state
  }
}

/**
 * Compares two release maps by content, using each release's `_rev` as the
 * change signal.
 *
 * @internal
 */
export function releasesAreEqual(
  previous: Map<string, ReleaseDocument>,
  next: Map<string, ReleaseDocument>,
): boolean {
  if (previous.size !== next.size) {
    return false
  }

  for (const [id, release] of next) {
    const previousRelease = previous.get(id)
    if (!previousRelease || previousRelease._rev !== release._rev) {
      return false
    }
  }

  return true
}

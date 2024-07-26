import {type BundleDocument} from './types'

interface BundleDeletedAction {
  id: string
  type: 'BUNDLE_DELETED'
}

interface BundleUpdatedAction {
  payload: BundleDocument
  type: 'BUNDLE_UPDATED'
}

interface BundlesSetAction {
  payload: BundleDocument[] | null
  type: 'BUNDLES_SET'
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

export type bundlesReducerAction =
  | BundleDeletedAction
  | BundleUpdatedAction
  | BundlesSetAction
  | BundleReceivedAction
  | LoadingStateChangedAction

export interface bundlesReducerState {
  bundles: Map<string, BundleDocument>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error
}

function createBundlesSet(bundles: BundleDocument[] | null) {
  return (bundles ?? []).reduce((acc, bundle) => {
    acc.set(bundle._id, bundle)
    return acc
  }, new Map<string, BundleDocument>())
}

export function bundlesReducer(
  state: bundlesReducerState,
  action: bundlesReducerAction,
): bundlesReducerState {
  switch (action.type) {
    case 'LOADING_STATE_CHANGED': {
      return {
        ...state,
        state: action.payload.loading ? 'loading' : 'loaded',
        error: action.payload.error,
      }
    }

    case 'BUNDLES_SET': {
      // Create an object with the BUNDLE id as key
      const bundlesById = createBundlesSet(action.payload)

      return {
        ...state,
        bundles: bundlesById,
      }
    }

    case 'BUNDLE_RECEIVED': {
      const receivedBundle = action.payload as BundleDocument
      const currentBundles = new Map(state.bundles)
      currentBundles.set(receivedBundle._id, receivedBundle)

      return {
        ...state,
        bundles: currentBundles,
      }
    }

    case 'BUNDLE_DELETED': {
      const currentBundles = new Map(state.bundles)
      currentBundles.delete(action.id)

      return {
        ...state,
        bundles: currentBundles,
      }
    }

    case 'BUNDLE_UPDATED': {
      const updatedBundle = action.payload
      const id = updatedBundle._id as string
      const currentBundles = new Map(state.bundles)
      currentBundles.set(id, updatedBundle)

      return {
        ...state,
        bundles: currentBundles,
      }
    }

    default:
      return state
  }
}

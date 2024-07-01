import {type BundleDocument} from './types'

interface BundleAddedAction {
  payload: BundleDocument
  type: 'BUNDLE_ADDED'
}

interface BundleDeletedAction {
  id: string
  type: 'BUNDLE_DELETED'
}

interface BundleUpdatedAction {
  payload: BundleDocument
  type: 'BUNDLE_UPDATED'
}

interface BundlesSetAction {
  payload: BundleDocument[]
  type: 'BUNDLES_SET'
}

interface BundleReceivedAction {
  payload: BundleDocument
  type: 'BUNDLE_RECEIVED'
}

export type bundlesReducerAction =
  | BundleAddedAction
  | BundleDeletedAction
  | BundleUpdatedAction
  | BundlesSetAction
  | BundleReceivedAction

export interface bundlesReducerState {
  bundles: Map<string, BundleDocument>
}

function createBundlesSet(bundles: BundleDocument[]) {
  const bundlesById = bundles.reduce((acc, bundle) => {
    acc.set(bundle._id, bundle)
    return acc
  }, new Map<string, BundleDocument>())
  return bundlesById
}

export function bundlesReducer(
  state: bundlesReducerState,
  action: bundlesReducerAction,
): bundlesReducerState {
  switch (action.type) {
    case 'BUNDLES_SET': {
      // Create an object with the BUNDLE id as key
      const bundlesById = createBundlesSet(action.payload)

      return {
        ...state,
        bundles: bundlesById,
      }
    }

    case 'BUNDLE_ADDED': {
      const addedBundle = action.payload as BundleDocument
      const currentBundles = new Map(state.bundles)
      currentBundles.set(addedBundle._id, addedBundle)

      return {
        ...state,
        bundles: currentBundles,
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

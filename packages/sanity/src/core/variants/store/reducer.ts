import {type SystemVariant} from '../types'

interface VariantDeletedAction {
  type: 'VARIANT_DELETED'
  payload: {
    id: string
  }
}

interface FetchSucceededAction {
  type: 'FETCH_SUCCEEDED'
  payload: SystemVariant[] | null
}
interface VariantsSetAction {
  type: 'VARIANTS_SET'
  payload: SystemVariant[] | null
}

interface LoadingStateChangedAction {
  type: 'LOADING_STATE_CHANGED'
  payload: {
    loading: boolean
    error: Error | undefined
  }
}

export type VariantStoreAction =
  | VariantsSetAction
  | LoadingStateChangedAction
  | VariantDeletedAction
  | FetchSucceededAction

export interface VariantStoreState {
  variants: Map<string, SystemVariant>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error
}

function createVariantsSet(variants: SystemVariant[] | null) {
  return (variants ?? []).reduce((acc, variant) => {
    acc.set(variant._id, variant)
    return acc
  }, new Map<string, SystemVariant>())
}

export function variantStoreReducer(
  state: VariantStoreState,
  action: VariantStoreAction,
): VariantStoreState {
  switch (action.type) {
    case 'LOADING_STATE_CHANGED': {
      return {
        ...state,
        state: action.payload.error ? 'error' : action.payload.loading ? 'loading' : 'loaded',
        error: action.payload.error,
      }
    }

    case 'VARIANTS_SET': {
      const variantsById = createVariantsSet(action.payload)

      return {
        ...state,
        variants: variantsById,
      }
    }
    case 'FETCH_SUCCEEDED': {
      const variantsById = createVariantsSet(action.payload)
      return {
        ...state,
        variants: variantsById,
        state: 'loaded',
        error: undefined,
      }
    }

    case 'VARIANT_DELETED': {
      const {id} = action.payload
      const restVariants = new Map(state.variants)
      restVariants.delete(id)

      return {
        ...state,
        variants: restVariants,
      }
    }

    default:
      return state
  }
}

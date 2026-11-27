import {type StoredSystemVariant, type SystemVariant} from '../types'
import {normalizeStoredVariant} from './normalizeStoredVariant'

interface VariantDeletedAction {
  type: 'VARIANT_DELETED'
  payload: {
    id: string
  }
}

interface FetchSucceededAction {
  type: 'FETCH_SUCCEEDED'
  payload: StoredSystemVariant[] | null
}
interface VariantsSetAction {
  type: 'VARIANTS_SET'
  payload: StoredSystemVariant[] | null
}

interface VariantsMigratedAction {
  type: 'VARIANTS_MIGRATED'
  payload: {
    ids: string[]
  }
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
  | VariantsMigratedAction
  | FetchSucceededAction

export interface VariantStoreState {
  variants: Map<string, SystemVariant>
  state: 'initialising' | 'loading' | 'loaded' | 'error'
  error?: Error
}

function createVariantsSet(variants: StoredSystemVariant[] | null) {
  return (variants ?? []).reduce((acc, variant) => {
    acc.set(variant._id, normalizeStoredVariant(variant))
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

    case 'VARIANTS_MIGRATED': {
      const migratedVariants = new Map(state.variants)
      for (const id of action.payload.ids) {
        const variant = migratedVariants.get(id)
        if (variant?.needsMigration) {
          migratedVariants.set(id, {...variant, needsMigration: false})
        }
      }

      return {
        ...state,
        variants: migratedVariants,
      }
    }

    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

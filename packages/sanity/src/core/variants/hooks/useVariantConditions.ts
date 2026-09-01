import {useCallback, useMemo, useSyncExternalStore} from 'react'

import {type VariantConditionsContext} from '../../config/types'
import {useWorkspace} from '../../studio/workspace'
import {
  type ConditionMismatch,
  getVariantConditionMismatches,
} from '../util/getVariantConditionMismatches'
import {
  type NormalizedVariantConditionMap,
  normalizeVariantConditions,
} from '../util/normalizeVariantConditions'
import {
  getVariantConditionsSnapshot,
  type MappedConditionsSnapshot,
  retryVariantConditions,
  subscribeVariantConditions,
} from './variantConditionsCache'

/**
 * @internal
 */
export type UseVariantConditionsResult =
  | {mode: 'freeform'}
  | {mode: 'mapped'; status: 'loading'}
  | {mode: 'mapped'; status: 'error'; error: Error; retry: () => void}
  | {mode: 'mapped'; status: 'ready'; definitions: NormalizedVariantConditionMap[]}

const FREEFORM_RESULT: UseVariantConditionsResult = {mode: 'freeform'}
const IDLE_SNAPSHOT: MappedConditionsSnapshot = {status: 'loading'}
const INVALID_CONDITIONS_ERROR = new Error('Expected conditions to be an array or a function')
const NO_MISMATCHES: ConditionMismatch[] = []

/**
 * Resolves `beta.variants.conditions` when a variant surface needs the configured list.
 * Async resolvers share one in-flight request per workspace until `retry()`.
 *
 * @internal
 */
export function useVariantConditions(): UseVariantConditionsResult {
  const workspace = useWorkspace()
  const conditions = workspace.beta?.variants?.conditions
  const context = useMemo((): VariantConditionsContext => {
    return {
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      getClient: workspace.getClient,
    }
  }, [workspace.dataset, workspace.getClient, workspace.projectId])
  const resolver = typeof conditions === 'function' ? conditions : undefined
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!resolver) {
        return () => undefined
      }

      return subscribeVariantConditions(resolver, context, onStoreChange)
    },
    [context, resolver],
  )
  const getSnapshot = useCallback((): MappedConditionsSnapshot => {
    if (!resolver) {
      return IDLE_SNAPSHOT
    }

    return getVariantConditionsSnapshot(resolver, context)
  }, [context, resolver])
  const asyncSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const retry = useCallback(() => {
    if (!resolver) {
      return
    }

    retryVariantConditions(resolver, context)
  }, [context, resolver])

  if (typeof conditions === 'undefined') {
    return FREEFORM_RESULT
  }

  if (Array.isArray(conditions)) {
    return {
      mode: 'mapped',
      status: 'ready',
      definitions: normalizeVariantConditions(conditions),
    }
  }

  if (!resolver) {
    return {
      mode: 'mapped',
      status: 'error',
      error: INVALID_CONDITIONS_ERROR,
      retry,
    }
  }

  if (asyncSnapshot.status === 'error') {
    return {mode: 'mapped', status: 'error', error: asyncSnapshot.error, retry}
  }

  if (asyncSnapshot.status === 'ready') {
    return {mode: 'mapped', status: 'ready', definitions: asyncSnapshot.definitions}
  }

  return {mode: 'mapped', status: 'loading'}
}

/**
 * Stored condition pairs that do not match the configured list.
 * Empty while the list is unset, loading, or failed.
 *
 * @internal
 */
export function useVariantConditionMismatches(
  conditions: Record<string, string> | undefined,
): ConditionMismatch[] {
  const config = useVariantConditions()

  return useMemo(() => {
    if (!conditions || config.mode !== 'mapped' || config.status !== 'ready') {
      return NO_MISMATCHES
    }

    return getVariantConditionMismatches(conditions, config.definitions)
  }, [conditions, config])
}

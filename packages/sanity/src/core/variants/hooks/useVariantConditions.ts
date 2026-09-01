import {useCallback, useEffect, useMemo, useState} from 'react'

import {type ConfigContext} from '../../config/types'
import {useWorkspace} from '../../studio/workspace'
import {
  type NormalizedVariantConditionMap,
  normalizeVariantConditions,
} from '../util/normalizeVariantConditions'

/**
 * @internal
 */
export type UseVariantConditionsResult =
  | {mode: 'freeform'}
  | {mode: 'mapped'; status: 'loading'}
  | {mode: 'mapped'; status: 'error'; error: Error; retry: () => void}
  | {mode: 'mapped'; status: 'ready'; definitions: NormalizedVariantConditionMap[]}

type AsyncLoadState =
  | {generation: number; status: 'ready'; definitions: NormalizedVariantConditionMap[]}
  | {generation: number; status: 'error'; error: Error}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Resolves `beta.variants.conditions` when the variant form opens.
 *
 * @internal
 */
export function useVariantConditions(): UseVariantConditionsResult {
  const workspace = useWorkspace()
  const conditions = workspace.beta?.variants?.conditions
  const context = useMemo((): ConfigContext => {
    return {
      projectId: workspace.projectId,
      dataset: workspace.dataset,
      schema: workspace.schema,
      currentUser: workspace.currentUser,
      getClient: workspace.getClient,
      i18n: workspace.i18n,
    }
  }, [
    workspace.currentUser,
    workspace.dataset,
    workspace.getClient,
    workspace.i18n,
    workspace.projectId,
    workspace.schema,
  ])
  const [generation, setGeneration] = useState(0)
  const [asyncState, setAsyncState] = useState<AsyncLoadState | null>(null)
  const retry = useCallback(() => {
    setGeneration((current) => current + 1)
  }, [])

  const resolve = typeof conditions === 'function' ? conditions : undefined

  useEffect(() => {
    if (!resolve) {
      return undefined
    }

    const loadGeneration = generation
    let cancelled = false

    Promise.resolve()
      .then(() => resolve(context))
      .then((value) => {
        if (cancelled) {
          return
        }

        setAsyncState({
          generation: loadGeneration,
          status: 'ready',
          definitions: normalizeVariantConditions(value),
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setAsyncState({generation: loadGeneration, status: 'error', error: toError(error)})
      })

    return () => {
      cancelled = true
    }
  }, [context, generation, resolve])

  if (typeof conditions === 'undefined') {
    return {mode: 'freeform'}
  }

  if (Array.isArray(conditions)) {
    return {
      mode: 'mapped',
      status: 'ready',
      definitions: normalizeVariantConditions(conditions),
    }
  }

  if (typeof conditions !== 'function') {
    return {
      mode: 'mapped',
      status: 'error',
      error: new Error('Expected conditions to be an array or a function'),
      retry,
    }
  }

  if (asyncState?.generation === generation && asyncState.status === 'ready') {
    return {mode: 'mapped', status: 'ready', definitions: asyncState.definitions}
  }

  if (asyncState?.generation === generation && asyncState.status === 'error') {
    return {mode: 'mapped', status: 'error', error: asyncState.error, retry}
  }

  return {mode: 'mapped', status: 'loading'}
}

import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {defer, type Observable, of, Subject} from 'rxjs'
import {catchError, map, shareReplay, startWith, switchMap, timeout} from 'rxjs/operators'

import {type VariantConditions, type VariantConditionsContext} from '../../config/types'
import {memoize} from '../../store/document/utils/createMemoizer'
import {useWorkspace} from '../../studio/workspace'
import {
  type ConditionMismatch,
  getVariantConditionMismatches,
} from '../util/getVariantConditionMismatches'
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

/**
 * How long a `beta.variants.conditions` resolver may take before the form reports an error.
 * A resolver whose request is parked (network/CORS) never settles; without this the form would
 * spin forever with no way to retry.
 *
 * @internal
 */
export const RESOLVE_VARIANT_CONDITIONS_TIMEOUT_MS = 10_000

type ConditionsResolver = Exclude<VariantConditions, unknown[]>

const LOADING_RESULT: UseVariantConditionsResult = {mode: 'mapped', status: 'loading'}
const NOOP = () => undefined

const resolverIds = new WeakMap<ConditionsResolver, number>()
let nextResolverId = 0

/**
 * `memoize` keys by string, so each resolver function gets a stable numeric id. Two workspaces
 * on the same project/dataset with different resolvers must not share one cached stream.
 */
function resolverKey(resolver: ConditionsResolver, context: VariantConditionsContext): string {
  let id = resolverIds.get(resolver)
  if (id === undefined) {
    id = nextResolverId++
    resolverIds.set(resolver, id)
  }

  return `${id}:${context.projectId}:${context.dataset}`
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function resolveConditions$(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
  retry: () => void,
): Observable<UseVariantConditionsResult> {
  return defer(() => Promise.resolve(resolver(context))).pipe(
    timeout({first: RESOLVE_VARIANT_CONDITIONS_TIMEOUT_MS}),
    map((value): UseVariantConditionsResult => ({
      mode: 'mapped',
      status: 'ready',
      definitions: normalizeVariantConditions(value),
    })),
    catchError((resolveError: unknown) => {
      const error = toError(resolveError)
      console.error('[sanity] Failed to resolve `beta.variants.conditions`', error)

      return of({mode: 'mapped', status: 'error', error, retry} as const)
    }),
    startWith(LOADING_RESULT),
  )
}

/**
 * One shared stream per resolver and workspace: every consumer sees the same in-flight load, and
 * `retry` re-runs the resolver for all of them.
 */
const getResolverResult$ = memoize(function getResolverResult$(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
): Observable<UseVariantConditionsResult> {
  const retry$ = new Subject<void>()
  const retry = () => retry$.next()

  return retry$.pipe(
    startWith(undefined),
    switchMap(() => resolveConditions$(resolver, context, retry)),
    shareReplay({bufferSize: 1, refCount: true}),
  )
}, resolverKey)

function getVariantConditions$(
  conditions: VariantConditions | undefined,
  context: VariantConditionsContext,
): Observable<UseVariantConditionsResult> {
  if (typeof conditions === 'undefined') {
    return of({mode: 'freeform'})
  }

  if (Array.isArray(conditions)) {
    return of({
      mode: 'mapped',
      status: 'ready',
      definitions: normalizeVariantConditions(conditions),
    })
  }

  if (typeof conditions === 'function') {
    return getResolverResult$(conditions, context)
  }

  // Unreachable after `variantsConditionsReducer` has validated the config; kept as a type guard.
  return of({
    mode: 'mapped',
    status: 'error',
    error: new Error('Expected conditions to be an array or a function'),
    retry: NOOP,
  })
}

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
  const result$ = useMemo(() => getVariantConditions$(conditions, context), [conditions, context])

  return useObservable(result$, LOADING_RESULT)
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
      return []
    }

    return getVariantConditionMismatches(conditions, config.definitions)
  }, [conditions, config])
}

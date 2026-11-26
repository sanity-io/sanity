import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, defer, type Observable, of, Subject} from 'rxjs'
import {
  catchError,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
  timeout,
} from 'rxjs/operators'

import {
  type VariantConditionMap,
  type VariantConditions,
  type VariantConditionsContext,
  type VariantTypeConfig,
  type VariantTypeContext,
  type VariantTypesConfig,
} from '../../config/types'
import {memoize} from '../../store/document/utils/createMemoizer'
import {useWorkspace} from '../../studio/workspace'
import {getPrintableType} from '../../util/getPrintableType'
import {isRecord} from '../../util/isRecord'
import {
  VariantConditionsLoaded,
  type VariantConditionsLoadedInfo,
} from '../__telemetry__/variants.telemetry'
import {
  type ConditionMismatch,
  getVariantConditionMismatches,
} from '../util/getVariantConditionMismatches'
import {
  type NormalizedVariantConditionMap,
  normalizeVariantConditions,
} from '../util/normalizeVariantConditions'
import {
  assertOnlyVariantType,
  DEFAULT_VARIANT_TYPE_KEY,
  defaultVariantTypesRecord,
  isVariantTypeKey,
  variantTypeLabel,
} from '../util/variantType'
import {getStaticConditionsLoadInfo, trackConditionsLoad} from './trackConditionsLoad'

/**
 * @internal
 */
export type UseVariantConditionsResult =
  | {mode: 'freeform'}
  | {mode: 'mapped'; status: 'loading'}
  | {mode: 'mapped'; status: 'error'; error: Error; retry?: () => void}
  | {mode: 'mapped'; status: 'ready'; definitions: NormalizedVariantConditionMap[]}

/**
 * One resolved variant type and the state of its condition list.
 *
 * @internal
 */
export interface ResolvedVariantType {
  key: string
  label: string
  description?: string
  conditions: UseVariantConditionsResult
}

/**
 * @internal
 */
export type UseVariantTypesResult =
  | {status: 'loading'}
  | {status: 'error'; error: Error; retry: () => void}
  | {status: 'ready'; types: ResolvedVariantType[]}

const RESOLVE_VARIANT_CONDITIONS_TIMEOUT_MS = 30_000

type ConditionsResolver = Exclude<VariantConditions, unknown[]>
type TypesResolver = Exclude<VariantTypesConfig, {variant?: VariantTypeConfig}>

type ReportConditionsLoaded = (info: VariantConditionsLoadedInfo) => void

const LOADING_CONDITIONS: UseVariantConditionsResult = {mode: 'mapped', status: 'loading'}
const LOADING_TYPES: UseVariantTypesResult = {status: 'loading'}
const NOOP = () => undefined

const resolverIds = new WeakMap<ConditionsResolver | TypesResolver, number>()
let nextResolverId = 0

const staticConditionIds = new WeakMap<readonly VariantConditionMap[], number>()
let nextStaticConditionId = 0

interface ResolverCacheScope {
  context: VariantConditionsContext
  workspaceName: string
  report: ReportConditionsLoaded
}

function resolverIdentity(resolver: ConditionsResolver | TypesResolver): number {
  let id = resolverIds.get(resolver)
  if (id === undefined) {
    id = nextResolverId++
    resolverIds.set(resolver, id)
  }

  return id
}

function resolverKey(resolver: ConditionsResolver, scope: ResolverCacheScope): string {
  return `${resolverIdentity(resolver)}:${scope.workspaceName}:${scope.context.projectId}:${scope.context.dataset}:${scope.context.type}`
}

function typesResolverKey(
  resolver: TypesResolver,
  scope: {context: VariantTypeContext; workspaceName: string},
): string {
  return `${resolverIdentity(resolver)}:${scope.workspaceName}:${scope.context.projectId}:${scope.context.dataset}`
}

function staticConditionsKey(conditions: readonly VariantConditionMap[], type: string): string {
  let id = staticConditionIds.get(conditions)

  if (id === undefined) {
    id = nextStaticConditionId++
    staticConditionIds.set(conditions, id)
  }

  return `static:${id}:${type}`
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function emptyConditionsError(type: string): Error {
  return new Error(
    `Expected \`beta.variants.types.${type}.conditions\` to include at least one valid entry`,
  )
}

function toReadyConditions(
  value: unknown,
  type: string,
): Extract<UseVariantConditionsResult, {status: 'ready'}> {
  const definitions = normalizeVariantConditions(value, `beta.variants.types.${type}.conditions`)

  if (definitions.length === 0) {
    throw emptyConditionsError(type)
  }

  return {mode: 'mapped', status: 'ready', definitions}
}

function toConfigError(
  configError: unknown,
  type: string,
): Extract<UseVariantConditionsResult, {status: 'error'}> {
  const error = toError(configError)
  console.error(`[sanity] Invalid \`beta.variants.types.${type}.conditions\``, error)

  return {mode: 'mapped', status: 'error', error}
}

function toConditionsError(
  resolveError: unknown,
  retry: () => void,
  type: string,
): Extract<UseVariantConditionsResult, {status: 'error'}> {
  const error = toError(resolveError)
  console.error(`[sanity] Failed to resolve \`beta.variants.types.${type}.conditions\``, error)

  return {mode: 'mapped', status: 'error', error, retry}
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  )
}

function isConditionsValue(value: unknown): value is VariantConditions {
  return Array.isArray(value) || typeof value === 'function'
}

function readTypesRecord(value: unknown): Record<string, VariantTypeConfig> {
  // An empty map is the omitted config. null, a string, or any other non-object is a broken resolver.
  if (isRecord(value) && Object.keys(value).length === 0) {
    return defaultVariantTypesRecord()
  }

  if (!isRecord(value)) {
    throw new Error(
      `Expected \`beta.variants.types\` to resolve to an object, but received ${getPrintableType(value)}`,
    )
  }

  for (const [key, entry] of Object.entries(value)) {
    if (!isVariantTypeKey(key)) {
      throw new Error(
        `Expected \`beta.variants.types\` keys to be lowercase identifiers, but received ${JSON.stringify(key)}`,
      )
    }

    // TODO: Remove this once we support multiple variant types
    assertOnlyVariantType(key)

    if (!isRecord(entry)) {
      throw new Error(
        `Expected \`beta.variants.types.${key}\` to be an object, but received ${getPrintableType(entry)}`,
      )
    }

    if (typeof entry.conditions !== 'undefined' && !isConditionsValue(entry.conditions)) {
      throw new Error(
        `Expected \`beta.variants.types.${key}.conditions\` to be an array or a function`,
      )
    }
  }

  return value as Record<string, VariantTypeConfig>
}

function resolveConditions$(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
  retry: () => void,
  report: ReportConditionsLoaded,
): Observable<UseVariantConditionsResult> {
  return defer(() => {
    const load = trackConditionsLoad(context)

    return defer(() => {
      const value = resolver(load.context)
      load.setAsync(isPromiseLike(value))
      return Promise.resolve(value)
    }).pipe(
      timeout({first: RESOLVE_VARIANT_CONDITIONS_TIMEOUT_MS}),
      map((value) => toReadyConditions(value, context.type)),
      tap((result) => report(load.finish(result.definitions))),
      catchError((resolveError: unknown) => {
        report(load.finish(undefined, resolveError))
        return of(toConditionsError(resolveError, retry, context.type))
      }),
      finalize(load.stop),
    )
  }).pipe(startWith(LOADING_CONDITIONS))
}

const getResolverResult$ = memoize(function getResolverResult$(
  resolver: ConditionsResolver,
  scope: ResolverCacheScope,
): Observable<UseVariantConditionsResult> {
  const {context, report} = scope
  const retry$ = new Subject<void>()
  const retry = () => retry$.next()

  return retry$.pipe(
    startWith(undefined),
    switchMap(() => resolveConditions$(resolver, context, retry, report)),
    shareReplay({bufferSize: 1, refCount: false}),
  )
}, resolverKey)

/**
 * One normalized list per config array. Overview rows and menu items all read this, so a static
 * list is not normalized again for every variant.
 */
const getStaticResult$ = memoize(function getStaticResult$(
  conditions: readonly VariantConditionMap[],
  type: string,
  report: ReportConditionsLoaded,
): Observable<UseVariantConditionsResult> {
  return defer(() => {
    let result: UseVariantConditionsResult
    try {
      result = toReadyConditions(conditions, type)
      report(getStaticConditionsLoadInfo(result.definitions))
    } catch (error) {
      result = toConfigError(error, type)
      report(getStaticConditionsLoadInfo(undefined))
    }
    return of(result)
  }).pipe(shareReplay({bufferSize: 1, refCount: false}))
}, staticConditionsKey)

function getVariantConditions$(
  conditions: VariantConditions | undefined,
  context: VariantConditionsContext,
  workspaceName: string,
  report: ReportConditionsLoaded,
): Observable<UseVariantConditionsResult> {
  if (typeof conditions === 'undefined') {
    return of({mode: 'freeform'})
  }

  if (Array.isArray(conditions)) {
    return getStaticResult$(conditions, context.type, report)
  }

  if (typeof conditions === 'function') {
    return getResolverResult$(conditions, {context, workspaceName, report})
  }

  return of({
    mode: 'mapped',
    status: 'error',
    error: new Error('Expected conditions to be an array or a function'),
  })
}

function applyConditionKeyOverlap(types: ResolvedVariantType[]): ResolvedVariantType[] {
  const owner = new Map<string, string>()
  const messageByType = new Map<string, string>()

  for (const type of types) {
    if (type.conditions.mode !== 'mapped' || type.conditions.status !== 'ready') {
      continue
    }

    for (const definition of type.conditions.definitions) {
      const previous = owner.get(definition.name)

      if (!previous) {
        owner.set(definition.name, type.key)
        continue
      }

      const message = `Condition key "${definition.name}" is declared on both "${previous}" and "${type.key}"`
      messageByType.set(previous, message)
      messageByType.set(type.key, message)
    }
  }

  if (messageByType.size === 0) {
    return types
  }

  return types.map((type) => {
    const message = messageByType.get(type.key)

    if (!message) {
      return type
    }

    return {
      ...type,
      conditions: {
        mode: 'mapped',
        status: 'error',
        error: new Error(message),
        retry: NOOP,
      },
    }
  })
}

function resolveTypeEntries$(
  record: Record<string, VariantTypeConfig>,
  context: VariantTypeContext,
  workspaceName: string,
  report: ReportConditionsLoaded,
): Observable<UseVariantTypesResult> {
  const entries = Object.entries(record)

  if (entries.length === 0) {
    return resolveTypeEntries$(defaultVariantTypesRecord(), context, workspaceName, report)
  }

  const streams = entries.map(([key, config]) =>
    getVariantConditions$(config.conditions, {...context, type: key}, workspaceName, report).pipe(
      map((conditions): ResolvedVariantType => ({
        key,
        label: variantTypeLabel(key, config.label),
        description: config.description,
        conditions,
      })),
    ),
  )

  return combineLatest(streams).pipe(
    map((types) => ({status: 'ready' as const, types: applyConditionKeyOverlap(types)})),
  )
}

function resolveTypesFunction$(
  resolver: TypesResolver,
  context: VariantTypeContext,
  workspaceName: string,
  report: ReportConditionsLoaded,
): Observable<UseVariantTypesResult> {
  const retry$ = new Subject<void>()
  const retry = () => retry$.next()

  return retry$.pipe(
    startWith(undefined),
    switchMap(() =>
      defer(() => Promise.resolve(resolver(context))).pipe(
        timeout({first: RESOLVE_VARIANT_CONDITIONS_TIMEOUT_MS}),
        switchMap((value) =>
          resolveTypeEntries$(readTypesRecord(value), context, workspaceName, report),
        ),
        catchError((resolveError: unknown) => {
          const error = toError(resolveError)
          console.error('[sanity] Failed to resolve `beta.variants.types`', error)
          return of<UseVariantTypesResult>({status: 'error', error, retry})
        }),
        startWith<UseVariantTypesResult>(LOADING_TYPES),
      ),
    ),
  )
}

const getTypesResolverResult$ = memoize(function getTypesResolverResult$(
  resolver: TypesResolver,
  scope: {context: VariantTypeContext; workspaceName: string; report: ReportConditionsLoaded},
): Observable<UseVariantTypesResult> {
  return resolveTypesFunction$(resolver, scope.context, scope.workspaceName, scope.report).pipe(
    shareReplay({bufferSize: 1, refCount: false}),
  )
}, typesResolverKey)

function isTypesResolver(types: VariantTypesConfig): types is TypesResolver {
  return typeof types === 'function'
}

function getVariantTypes$(
  types: VariantTypesConfig | undefined,
  context: VariantTypeContext,
  workspaceName: string,
  report: ReportConditionsLoaded,
): Observable<UseVariantTypesResult> {
  if (typeof types === 'undefined') {
    return resolveTypeEntries$(defaultVariantTypesRecord(), context, workspaceName, report)
  }

  if (isTypesResolver(types)) {
    return getTypesResolverResult$(types, {context, workspaceName, report})
  }

  return resolveTypeEntries$(readTypesRecord(types), context, workspaceName, report)
}

function variantTypeContext(workspace: {
  projectId: string
  dataset: string
  getClient: VariantTypeContext['getClient']
}): VariantTypeContext {
  return {
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    getClient: workspace.getClient,
  }
}

const VARIANT_TYPES_LOADING = {status: 'loading'} as const
/**
 * Resolves `beta.variants.types` when a variant surface needs them.
 * An omitted or empty map is the default `{variant: {label: 'Variant'}}` type.
 *
 * @internal
 */
export function useVariantTypes(): UseVariantTypesResult {
  const workspace = useWorkspace()
  const telemetry = useTelemetry()
  const types = workspace.beta?.variants?.types
  const context = useMemo(() => variantTypeContext(workspace), [workspace])
  // The resolves are cached per workspace and outlive the hook, so they report through the
  // logger of the first hook that asked for them
  const reportConditionsLoaded = useCallback<ReportConditionsLoaded>(
    (info) => telemetry.log(VariantConditionsLoaded, info),
    [telemetry],
  )
  const result$ = useMemo(
    () => getVariantTypes$(types, context, workspace.name, reportConditionsLoaded),
    [context, reportConditionsLoaded, types, workspace.name],
  )

  return useObservable(result$, VARIANT_TYPES_LOADING)
}

/**
 * Condition list for one variant type. Defaults to {@link DEFAULT_VARIANT_TYPE_KEY}.
 *
 * @internal
 */
export function useVariantConditions(
  typeKey: string = DEFAULT_VARIANT_TYPE_KEY,
): UseVariantConditionsResult {
  const types = useVariantTypes()

  if (types.status === 'loading') {
    return LOADING_CONDITIONS
  }

  if (types.status === 'error') {
    return {mode: 'mapped', status: 'error', error: types.error, retry: types.retry}
  }

  return (
    types.types.find((type) => type.key === typeKey)?.conditions ?? {
      mode: 'freeform',
    }
  )
}

/**
 * Stored condition pairs that do not match the configured list for `typeKey`.
 * Empty while that type's list is unset, loading, or failed.
 *
 * @internal
 */
export function useVariantConditionMismatches(
  conditions: Record<string, string> | undefined,
  typeKey: string = DEFAULT_VARIANT_TYPE_KEY,
): ConditionMismatch[] {
  const config = useVariantConditions(typeKey)

  return useMemo(() => {
    if (!conditions || config.mode !== 'mapped' || config.status !== 'ready') {
      return []
    }

    return getVariantConditionMismatches(conditions, config.definitions)
  }, [conditions, config])
}

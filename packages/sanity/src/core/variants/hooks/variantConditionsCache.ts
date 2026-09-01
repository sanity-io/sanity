import {type VariantConditions, type VariantConditionsContext} from '../../config/types'
import {
  type NormalizedVariantConditionMap,
  normalizeVariantConditions,
} from '../util/normalizeVariantConditions'

/**
 * @internal
 */
export type MappedConditionsSnapshot =
  | {status: 'loading'}
  | {status: 'ready'; definitions: NormalizedVariantConditionMap[]}
  | {status: 'error'; error: Error}

type ConditionsResolver = Exclude<VariantConditions, unknown[]>

interface CacheEntry {
  generation: number
  inFlightGeneration: number | null
  listeners: Set<() => void>
  resolver: ConditionsResolver
  context: VariantConditionsContext
  snapshot: MappedConditionsSnapshot
}

const LOADING_SNAPSHOT: MappedConditionsSnapshot = {status: 'loading'}
const cache = new WeakMap<ConditionsResolver, Map<string, CacheEntry>>()

function workspaceKey(context: VariantConditionsContext): string {
  return `${context.projectId}:${context.dataset}`
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function notify(entry: CacheEntry): void {
  for (const listener of entry.listeners) {
    listener()
  }
}

function getCacheEntry(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
): CacheEntry {
  let byWorkspace = cache.get(resolver)
  if (!byWorkspace) {
    byWorkspace = new Map()
    cache.set(resolver, byWorkspace)
  }

  const key = workspaceKey(context)
  const existing = byWorkspace.get(key)
  if (existing) {
    existing.resolver = resolver
    existing.context = context
    return existing
  }

  const entry: CacheEntry = {
    generation: 0,
    inFlightGeneration: null,
    listeners: new Set(),
    resolver,
    context,
    snapshot: LOADING_SNAPSHOT,
  }
  byWorkspace.set(key, entry)
  return entry
}

function ensureLoad(entry: CacheEntry): void {
  if (entry.inFlightGeneration === entry.generation) {
    return
  }

  const generation = entry.generation
  const {resolver, context} = entry
  entry.inFlightGeneration = generation

  Promise.resolve()
    .then(() => resolver(context))
    .then((value) => {
      if (entry.generation !== generation) {
        return
      }

      entry.snapshot = {status: 'ready', definitions: normalizeVariantConditions(value)}
      notify(entry)
    })
    .catch((error) => {
      if (entry.generation !== generation) {
        return
      }

      entry.snapshot = {status: 'error', error: toError(error)}
      notify(entry)
    })
}

/**
 * @internal
 */
export function subscribeVariantConditions(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
  onStoreChange: () => void,
): () => void {
  const entry = getCacheEntry(resolver, context)
  entry.listeners.add(onStoreChange)
  ensureLoad(entry)

  return () => {
    entry.listeners.delete(onStoreChange)
  }
}

/**
 * @internal
 */
export function getVariantConditionsSnapshot(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
): MappedConditionsSnapshot {
  return getCacheEntry(resolver, context).snapshot
}

/**
 * @internal
 */
export function retryVariantConditions(
  resolver: ConditionsResolver,
  context: VariantConditionsContext,
): void {
  const entry = getCacheEntry(resolver, context)
  entry.generation += 1
  entry.inFlightGeneration = null
  entry.snapshot = LOADING_SNAPSHOT
  notify(entry)
  ensureLoad(entry)
}

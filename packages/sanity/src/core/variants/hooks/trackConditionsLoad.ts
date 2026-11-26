import {TimeoutError} from 'rxjs'

import {type VariantConditionsContext} from '../../config/types'
import {type VariantConditionsLoadedInfo} from '../__telemetry__/variants.telemetry'
import {type NormalizedVariantConditionMap} from '../util/normalizeVariantConditions'

/** Hosts the studio talks to on its own, so their requests say nothing about the callback */
const IGNORED_HOST_SUFFIXES = ['sanity.io', 'sanity.work', 'sanity-cdn.com', 'sentry.io']
const REQUEST_INITIATORS = new Set(['fetch', 'xmlhttprequest'])

function isResourceTiming(entry: PerformanceEntry): entry is PerformanceResourceTiming {
  return entry.entryType === 'resource'
}

function getHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

function isIgnoredHost(hostname: string): boolean {
  if (typeof location !== 'undefined' && hostname === location.hostname) return true
  return IGNORED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  )
}

function observeResources(
  onEntries: (entries: PerformanceEntryList) => void,
): PerformanceObserver | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined
  try {
    const observer = new PerformanceObserver((list) => onEntries(list.getEntries()))
    observer.observe({type: 'resource'})
    return observer
  } catch {
    return undefined
  }
}

function countConditions(definitions: NormalizedVariantConditionMap[] | undefined) {
  return {
    conditionCount: definitions?.length ?? 0,
    valueCount:
      definitions?.reduce((count, definition) => count + definition.values.length, 0) ?? 0,
  }
}

/**
 * Describes a fixed list of conditions from the config for {@link VariantConditionsLoaded}.
 *
 * @internal
 */
export function getStaticConditionsLoadInfo(
  definitions: NormalizedVariantConditionMap[] | undefined,
): VariantConditionsLoadedInfo {
  return {
    source: 'static',
    async: false,
    outcome: definitions ? 'ready' : 'error',
    durationMs: 0,
    ...countConditions(definitions),
    usedSanityClient: false,
    endpoints: [],
  }
}

/**
 * Follows one call of a `conditions` callback: whether it returns a promise, whether it calls the
 * `getClient` it is given, and which hosts are requested until it settles.
 *
 * @internal
 */
export interface ConditionsLoadTracker {
  /** The context to call the callback with */
  context: VariantConditionsContext
  setAsync: (async: boolean) => void
  /** Ends the load, with the conditions it produced or the reason it failed */
  finish: (
    definitions: NormalizedVariantConditionMap[] | undefined,
    error?: unknown,
  ) => VariantConditionsLoadedInfo
  /** Stops watching requests, also when the load is abandoned */
  stop: () => void
}

/**
 * @internal
 */
export function trackConditionsLoad(context: VariantConditionsContext): ConditionsLoadTracker {
  const startedAt = performance.now()
  const hostnames = new Set<string>()
  let usedSanityClient = false
  let isAsync = false

  const collect = (entries: PerformanceEntryList) => {
    for (const entry of entries) {
      if (!isResourceTiming(entry) || entry.startTime < startedAt) continue
      if (!REQUEST_INITIATORS.has(entry.initiatorType)) continue
      const hostname = getHostname(entry.name)
      if (hostname && !isIgnoredHost(hostname)) hostnames.add(hostname)
    }
  }
  let observer = observeResources(collect)

  const stop = () => {
    if (!observer) return
    // Entries of requests that just finished may not have reached the callback yet
    collect(observer.takeRecords())
    observer.disconnect()
    observer = undefined
  }

  return {
    context: {
      ...context,
      getClient: (options) => {
        usedSanityClient = true
        return context.getClient(options)
      },
    },
    setAsync: (value) => {
      isAsync = value
    },
    finish: (definitions, error) => {
      stop()
      return {
        source: 'function',
        async: isAsync,
        outcome: definitions ? 'ready' : error instanceof TimeoutError ? 'timeout' : 'error',
        durationMs: Math.round(performance.now() - startedAt),
        ...countConditions(definitions),
        usedSanityClient,
        endpoints: [...hostnames].toSorted(),
      }
    },
    stop,
  }
}

import {TimeoutError} from 'rxjs'

import {type VariantConditionsContext} from '../../config/types'
import {type VariantConditionsLoadedInfo} from '../__telemetry__/variants.telemetry'
import {type NormalizedVariantConditionMap} from '../util/normalizeVariantConditions'

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
  }
}

/**
 * Follows one call of a `conditions` callback: whether it returns a promise, and whether it calls
 * the `getClient` it is given.
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
}

/**
 * @internal
 */
export function trackConditionsLoad(context: VariantConditionsContext): ConditionsLoadTracker {
  const startedAt = performance.now()
  let usedSanityClient = false
  let isAsync = false

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
    finish: (definitions, error) => ({
      source: 'function',
      async: isAsync,
      outcome: definitions ? 'ready' : error instanceof TimeoutError ? 'timeout' : 'error',
      durationMs: Math.round(performance.now() - startedAt),
      ...countConditions(definitions),
      usedSanityClient,
    }),
  }
}

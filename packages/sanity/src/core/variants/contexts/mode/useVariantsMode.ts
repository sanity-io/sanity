import {use} from 'react'
import {VariantsModePromiseContext} from 'sanity/_singletons'

import {type VariantsMode} from './types'

/**
 * The variants mode as a promise: `'default'` when the plan has the feature, `'upsell'` when it
 * does not, `null` when the feature check failed. Settles once the check has answered. Read it with
 * `use()` in the leaf that renders differently per mode, under a boundary close to that UI (the
 * variants tool suspends up to its own loading block); never awaited in an event handler.
 * @internal
 */
export function useVariantsMode(): Promise<VariantsMode> {
  const promise = use(VariantsModePromiseContext)
  if (!promise) throw new TypeError('VariantsModePromise: missing context value')
  return promise
}

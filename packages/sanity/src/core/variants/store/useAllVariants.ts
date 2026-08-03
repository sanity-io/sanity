import {useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'

import {type SystemVariant} from '../types'
import {useVariantsStore} from './useVariantsStore'

/**
 * Gets all variants.
 * @internal
 */
export function useAllVariants(): {
  data: SystemVariant[]
  byId: Map<string, SystemVariant>
  error?: Error
  loading: boolean
} {
  const {state$} = useVariantsStore()
  // Kept synchronous: variant resolution feeds `useTargetDocumentState`'s
  // target scope, so a deferred snapshot could bind the form checkout to the
  // wrong variant after navigation. Executable proof:
  // perspective/__tests__/deferralSafety.test.tsx.
  const {variants, error, state} = useSyncObservable(state$)!

  return useMemo(
    () => ({
      data: Array.from(variants.values()),
      byId: variants,
      error: error,
      loading: ['loading', 'initialising'].includes(state),
    }),
    [error, variants, state],
  )
}

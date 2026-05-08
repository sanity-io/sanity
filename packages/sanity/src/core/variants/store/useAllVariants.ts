import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type SystemVariant} from '../types'
import {useVariantsStore} from './useVariantsStore'

/**
 * Gets all variants.
 * @internal
 */
export function useAllVariants(): {
  data: SystemVariant[]
  error?: Error
  loading: boolean
} {
  const {state$} = useVariantsStore()
  const {variants, error, state} = useObservable(state$)!

  return useMemo(
    () => ({
      data: Array.from(variants.values()),
      error: error,
      loading: ['loading', 'initialising'].includes(state),
    }),
    [error, variants, state],
  )
}

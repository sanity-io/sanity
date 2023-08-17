import {SchemaType} from '@sanity/types'
import {useCallback} from 'react'
import {DEFAULT_MAX_RECURSION_DEPTH, resolveInitialValueForType} from '../../../templates'
import {useInitialValueResolverContext} from './useInitialValue'

/** @internal */
export function useResolveInitialValueForType<Params extends Record<string, unknown>>(): (
  /**
   * This is the name of the document.
   */
  type: SchemaType,
  /**
   * Params is a sanity context object passed to every initial value function.
   */
  params: Params,
) => Promise<any> {
  const initialValueContext = useInitialValueResolverContext()

  return useCallback(
    (type: SchemaType, params: Params) => {
      return resolveInitialValueForType(
        type,
        params,
        DEFAULT_MAX_RECURSION_DEPTH,
        initialValueContext,
      )
    },
    [initialValueContext],
  )
}

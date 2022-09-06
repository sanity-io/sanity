import {SchemaType} from '@sanity/types'
import {useCallback} from 'react'
import {resolveInitialValueForType} from '../../templates'
import {DEFAULT_MAX_RECURSION_DEPTH} from '../../templates/resolve'
import {useInitialValueResolverContext} from './useInitialValue'

export function useResolveInitialValueForType<Params extends Record<string, unknown>>(): (
  /**
   * This is the name of the document.
   */
  type: SchemaType,
  /**
   * Params is a sanity context object passed to every initial value function.
   */
  params: Params
) => Promise<any> {
  const initialValueContext = useInitialValueResolverContext()

  return useCallback(
    (type: SchemaType, params: Params) => {
      return resolveInitialValueForType(
        type,
        params,
        DEFAULT_MAX_RECURSION_DEPTH,
        initialValueContext
      )
    },
    [initialValueContext]
  )
}

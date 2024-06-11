import {useContext} from 'react'
import {TreeEditingEnabledContext, type TreeEditingEnabledContextValue} from 'sanity/_singletons'

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  return useContext(TreeEditingEnabledContext)
}

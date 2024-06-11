import {useContext} from 'react'

import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  return useContext(TreeEditingEnabledContext)
}

import {useContext} from 'react'
import {TreeEditingEnabledContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface TreeEditingEnabledContextValue {
  /**
   * A boolean indicating whether tree editing is enabled
   */
  enabled: boolean
  /**
   * A boolean indicating whether legacy editing is enabled
   */
  legacyEditing: boolean
}

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  return useContext(TreeEditingEnabledContext)
}

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
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing: boolean
}

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  return useContext(TreeEditingEnabledContext)
}

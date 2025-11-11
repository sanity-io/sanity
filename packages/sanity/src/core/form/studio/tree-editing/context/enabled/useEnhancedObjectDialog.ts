import {useContext} from 'react'
import {EnhancedObjectDialogContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface EnhancedObjectDialogContextValue {
  /**
   * A boolean indicating whether tree editing is enabled
   */
  enabled: boolean
  /**
   * A boolean indicating whether the EnhancedObjectDialog component is available in this tree to handle paths
   */
  isDialogAvailable: boolean
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing: boolean
}

/**
 * @internal
 */
export function useEnhancedObjectDialog(): EnhancedObjectDialogContextValue {
  return useContext(EnhancedObjectDialogContext)
}

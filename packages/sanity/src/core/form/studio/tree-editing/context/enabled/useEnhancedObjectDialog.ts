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
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing: boolean
}

/**
 * @internal
 * @deprecated This hook is no longer used and will be removed in a future release as we make the enhanced object dialog the default.
 */
export function useEnhancedObjectDialog(): EnhancedObjectDialogContextValue {
  return useContext(EnhancedObjectDialogContext)
}

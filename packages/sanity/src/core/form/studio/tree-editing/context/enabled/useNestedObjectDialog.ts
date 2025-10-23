import {useContext} from 'react'
import {NestedObjectDialogContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface NestedObjectDialogContextValue {
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
export function useNestedObjectDialog(): NestedObjectDialogContextValue {
  return useContext(NestedObjectDialogContext)
}

import {useContext} from 'react'
import {LegacyArrayEditingContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface LegacyArrayEditingContextValue {
  /**
   * A boolean indicating whether legacy editing is enabled
   */
  enabled: boolean
}

/**
 * @internal
 */
export function useLegacyArrayEditing(): LegacyArrayEditingContextValue {
  return useContext(LegacyArrayEditingContext)
}

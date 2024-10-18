import {useContext} from 'react'

import {StartInCreateContext} from '../../../../_singletons/context/StartInCreateContext'

/**
 * @internal
 */
export interface StartInCreateEnabledContextValue {
  /**
   * A boolean indicating whether "Start in Create" new document pane footer should be shown, when available.
   */
  enabled: boolean
}

/**
 * @internal
 */
export function useStartInCreateEnabled(): StartInCreateEnabledContextValue {
  const context = useContext(StartInCreateContext)
  if (!context) {
    throw new Error('useStartInCreateEnabled must be used within a StartInCreateProvider')
  }
  return context
}

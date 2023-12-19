import {createContext, useContext} from 'react'
import type {FreeTrialResponse} from './types'

/**
 * @internal
 */
export interface FreeTrialContextProps {
  data: FreeTrialResponse | null
  showDialog: boolean
  showOnLoad: boolean
  /**
   * If the user is seeing the `showOnLoad` popover or modal, and clicks on the pricing button the `showOnClick` modal should be triggered.
   */
  toggleShowContent: (closeAndReOpen?: boolean) => void
}

/**
 * @internal
 */
export const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(undefined)

/**
 * @internal
 */
export const useFreeTrialContext = (): FreeTrialContextProps => {
  const context = useContext(FreeTrialContext)
  if (!context) {
    throw new Error('useFreeTrial must be used within a FreeTrialProvider')
  }
  return context
}

import {createContext} from 'react'
import type {FreeTrialContextProps} from 'sanity'

/**
 * @internal
 */
export const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(undefined)

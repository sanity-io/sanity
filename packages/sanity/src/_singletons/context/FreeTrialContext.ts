import type {FreeTrialContextProps} from '../../core/studio/components/navbar/free-trial/FreeTrialContext'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(
  'sanity/_singletons/context/free-trial',
  undefined,
)

import {createContext} from 'sanity/_createContext'

import type {FreeTrialContextProps} from '../../core/studio/components/navbar/free-trial/FreeTrialContext'

/**
 * @internal
 */
export const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(
  'sanity/_singletons/context/free-trial',
  undefined,
)

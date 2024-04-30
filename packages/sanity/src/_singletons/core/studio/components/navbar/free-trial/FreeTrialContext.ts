import {createContext} from 'react'

import type {FreeTrialContextProps} from '../../../../../../core/studio/components/navbar/free-trial/FreeTrialContext'

/**
 * @internal
 */
export const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(undefined)

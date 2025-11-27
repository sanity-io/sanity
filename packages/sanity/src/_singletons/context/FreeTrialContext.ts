import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {FreeTrialContextProps} from '../../core/studio/components/navbar/free-trial/FreeTrialContext'

/**
 * @internal
 */
export const FreeTrialContext: Context<FreeTrialContextProps | undefined> = createContext<
  FreeTrialContextProps | undefined
>('sanity/_singletons/context/free-trial', undefined)

import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PresentationContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationContext: Context<PresentationContextValue | null> =
  createContext<PresentationContextValue | null>('sanity/_singletons/context/presentation', null)

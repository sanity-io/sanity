import {createContext} from 'sanity/_createContext'

import type {PresentationContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationContext: React.Context<PresentationContextValue | null> =
  createContext<PresentationContextValue | null>('sanity/_singletons/context/presentation', null)

import {createContext} from 'sanity/_createContext'

import type {PresentationNavigateContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationNavigateContext: React.Context<PresentationNavigateContextValue | null> =
  createContext<PresentationNavigateContextValue | null>(
    'sanity/_singletons/context/presentation/navigate',
    null,
  )

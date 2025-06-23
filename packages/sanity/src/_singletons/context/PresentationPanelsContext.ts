import {createContext} from 'sanity/_createContext'

import type {PresentationPanelsContextValue} from '../../presentation/panels/types'

/**
 * @internal
 */
export const PresentationPanelsContext: React.Context<PresentationPanelsContextValue | null> =
  createContext<PresentationPanelsContextValue | null>(
    'sanity/_singletons/context/presentation/panels',
    null,
  )

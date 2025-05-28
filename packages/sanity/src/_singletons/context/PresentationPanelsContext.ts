import {createContext} from 'sanity/_createContext'

import type {PresentationPanelsContextValue} from '../../presentation/panels/types'

/**
 * @internal
 */
export const PresentationPanelsContext = createContext<PresentationPanelsContextValue | null>(
  'sanity/_singletons/context/presentation/panels',
  null,
)

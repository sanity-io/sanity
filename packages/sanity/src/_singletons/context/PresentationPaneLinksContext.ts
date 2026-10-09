import {createContext} from 'sanity/_createContext'

import type {PresentationPaneLinksContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationPaneLinksContext = createContext<PresentationPaneLinksContextValue | null>(
  'sanity/_singletons/context/presentation/pane-links',
  null,
)

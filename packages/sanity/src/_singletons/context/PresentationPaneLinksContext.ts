import {createContext} from 'react'

import type {PresentationPaneLinksContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationPaneLinksContext = createContext<PresentationPaneLinksContextValue | null>(
  null,
)

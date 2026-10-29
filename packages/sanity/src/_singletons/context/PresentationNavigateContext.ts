import {createContext} from 'react'

import type {PresentationNavigateContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationNavigateContext = createContext<PresentationNavigateContextValue | null>(
  null,
)

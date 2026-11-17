import {createContext} from 'react'

import type {PresentationPanelsContextValue} from '../../presentation/panels/types'

/**
 * @internal
 */
export const PresentationPanelsContext = createContext<PresentationPanelsContextValue | null>(null)

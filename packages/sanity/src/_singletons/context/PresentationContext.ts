import {createContext} from 'react'

import type {PresentationContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationContext = createContext<PresentationContextValue | null>(null)

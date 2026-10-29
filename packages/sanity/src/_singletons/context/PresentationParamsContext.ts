import {createContext} from 'react'

import type {PresentationParamsContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationParamsContext = createContext<PresentationParamsContextValue | null>(null)

import {createContext} from 'react'

import {type PaneContextValue} from './types'

/**
 * @internal
 */
export const PaneContext = createContext<PaneContextValue | null>(null)

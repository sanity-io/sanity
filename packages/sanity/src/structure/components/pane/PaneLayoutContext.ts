import {createContext} from 'react'

import {type PaneLayoutContextValue} from './types'

/**
 * @internal
 */
export const PaneLayoutContext = createContext<PaneLayoutContextValue | null>(null)

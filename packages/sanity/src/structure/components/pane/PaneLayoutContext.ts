import {createContext} from 'react'
import {PaneLayoutContextValue} from './types'

/**
 * @internal
 */
export const PaneLayoutContext = createContext<PaneLayoutContextValue | null>(null)

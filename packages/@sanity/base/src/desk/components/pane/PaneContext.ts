import {createContext} from 'react'
import {PaneContextValue} from './types'

/**
 * @internal
 */
export const PaneContext = createContext<PaneContextValue | null>(null)

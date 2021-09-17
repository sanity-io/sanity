import {createContext} from 'react'
import {DeskToolContextValue} from './types'

/**
 * @internal
 */
export const DeskToolContext = createContext<DeskToolContextValue | null>(null)

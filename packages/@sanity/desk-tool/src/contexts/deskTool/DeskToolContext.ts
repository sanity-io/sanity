import {createContext} from 'react'
import type {DeskToolContextValue} from './types'

/**
 * @internal
 */
export const DeskToolContext = createContext<DeskToolContextValue | null>(null)

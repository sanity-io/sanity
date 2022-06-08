import {createContext} from 'react'
import {DeskToolContextValue} from './types'

export const DeskToolContext = createContext<DeskToolContextValue | null>(null)

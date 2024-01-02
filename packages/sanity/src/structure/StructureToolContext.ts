import {createContext} from 'react'
import {StuctureToolContextValue} from './types'

export const StructureToolContext = createContext<StuctureToolContextValue | null>(null)

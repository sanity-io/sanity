import {createContext} from 'react'
import type {StructureToolContextValue} from './types'

export const StructureToolContext = createContext<StructureToolContextValue | null>(null)

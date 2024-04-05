import {createContext} from 'react'
import type {StructureToolContextValue} from 'sanity/structure'

/**
 * @internal
 */
export const StructureToolContext = createContext<StructureToolContextValue | null>(null)

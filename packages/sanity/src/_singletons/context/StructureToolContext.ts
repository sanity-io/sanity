import type {StructureToolContextValue} from '../../structure/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const StructureToolContext = createContext<StructureToolContextValue | null>(
  'sanity/_singletons/context/structure-tool',
  null,
)

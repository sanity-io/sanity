import {createContext} from 'sanity/_createContext'

import type {StructureToolContextValue} from '../../structure/types'

/**
 * @internal
 */
export const StructureToolContext = createContext<StructureToolContextValue | null>(
  'sanity/_singletons/context/structure-tool',
  null,
)

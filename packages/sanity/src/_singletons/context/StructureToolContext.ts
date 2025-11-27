import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {StructureToolContextValue} from '../../structure/types'

/**
 * @internal
 */
export const StructureToolContext: Context<StructureToolContextValue | null> =
  createContext<StructureToolContextValue | null>('sanity/_singletons/context/structure-tool', null)

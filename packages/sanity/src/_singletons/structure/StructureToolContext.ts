import {createContext} from 'react'

import type {StructureToolContextValue} from '../../structure/types'

/**
 * @internal
 */
export const StructureToolContext = createContext<StructureToolContextValue | null>(null)

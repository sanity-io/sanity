import type {ReactNode} from 'react'
import {createContext} from 'react'

import type {Panes} from '../../structure/structureResolvers/useResolvedPanes'

/**
 * @internal
 */
export const ResolvedPanesContext = createContext<Panes | null>(null)

/**
 * @internal
 */
export function ResolvedPanesProvider({children, value}: {children: ReactNode; value: Panes}) {
  return <ResolvedPanesContext.Provider value={value}>{children}</ResolvedPanesContext.Provider>
}

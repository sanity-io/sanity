import type {ReactNode} from 'react'
import {createContext} from 'sanity/_createContext'

import type {Panes} from '../../structure/structureResolvers/useResolvedPanes'

/**
 * @internal
 */
export const ResolvedPanesContext = createContext<Panes | null>(
  'sanity/_singletons/context/resolved-panes',
  null,
)

/**
 * @internal
 */
export function ResolvedPanesProvider({children, value}: {children: ReactNode; value: Panes}) {
  return <ResolvedPanesContext.Provider value={value}>{children}</ResolvedPanesContext.Provider>
}

import type {ReactNode} from 'react'
import {createContext} from 'sanity/_createContext'

import type {ResolvedPanes} from '../../core/panes/types/resolvedPanes'

/**
 * @internal
 */
export const ResolvedPanesContext = createContext<ResolvedPanes | null>(
  'sanity/_singletons/context/resolved-panes',
  null,
)

/**
 * @internal
 */
export function ResolvedPanesProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ResolvedPanes
}) {
  return <ResolvedPanesContext.Provider value={value}>{children}</ResolvedPanesContext.Provider>
}

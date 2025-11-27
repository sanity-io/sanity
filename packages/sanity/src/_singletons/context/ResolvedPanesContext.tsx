import type {ReactNode} from 'react'
import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {Panes} from '../../structure/structureResolvers/useResolvedPanes'

/**
 * @internal
 */
export const ResolvedPanesContext: Context<Panes | null> = createContext<Panes | null>(
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
  value: Panes
}): React.JSX.Element {
  return <ResolvedPanesContext.Provider value={value}>{children}</ResolvedPanesContext.Provider>
}

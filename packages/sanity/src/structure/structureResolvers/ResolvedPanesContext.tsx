import {type ReactNode, useContext} from 'react'
import {createContext} from 'sanity/_createContext'

import {type Panes} from './useResolvedPanes'

const ResolvedPanesContext = createContext<Panes | null>(
  'sanity/_singletons/context/resolved-panes',
  null,
)

export function ResolvedPanesProvider({children, value}: {children: ReactNode; value: Panes}) {
  return <ResolvedPanesContext.Provider value={value}>{children}</ResolvedPanesContext.Provider>
}

export function useResolvedPanesContext(): Panes {
  const context = useContext(ResolvedPanesContext)
  if (!context) {
    throw new Error('useResolvedPanesContext must be used within ResolvedPanesProvider')
  }
  return context
}

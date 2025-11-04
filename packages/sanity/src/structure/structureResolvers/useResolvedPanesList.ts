import {useContext} from 'react'

import {ResolvedPanesContext} from './provider/ResolvedPanesProvider'
import {type Panes} from './useResolvedPanes'

export function useResolvedPanesList(): Panes {
  const context = useContext(ResolvedPanesContext)
  if (!context) {
    throw new Error('useResolvedPanesContext must be used within ResolvedPanesProvider')
  }
  return context
}

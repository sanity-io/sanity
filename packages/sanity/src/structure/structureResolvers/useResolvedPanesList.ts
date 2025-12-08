import {useContext} from 'react'
import {ResolvedPanesContext} from 'sanity/_singletons'

import {type Panes} from './useResolvedPanes'

const DEFAULT_VALUE = {
  paneDataItems: [],
  routerPanes: [],
  resolvedPanes: [],
  maximizedPane: null,
  setMaximizedPane: () => {
    // noop
  },
}
export function useResolvedPanesList(): Panes {
  const context = useContext(ResolvedPanesContext)

  // This allows components to be used outside of ResolvedPanesProvider
  // Such as Presensation which doesn't need to be concerned about the structure of the panes
  // As it always travels down the nearest pane to the document.
  return context ?? DEFAULT_VALUE
}

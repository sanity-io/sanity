import {useContext} from 'react'
import {ResolvedPanesContext} from 'sanity/_singletons'

import {type ResolvedPanes} from './types/resolvedPanes'

const DEFAULT_VALUE: ResolvedPanes = {
  paneDataItems: [],
  maximizedPane: null,
}

/**
 * Read the resolved panes provided by the host tool.
 *
 * This allows components to be used outside of `ResolvedPanesProvider`,
 * such as presentation, which doesn't need to be concerned about the
 * structure of the panes as it always travels down the nearest pane to
 * the document.
 *
 * @internal
 */
export function useResolvedPanesList(): ResolvedPanes {
  const context = useContext(ResolvedPanesContext)

  return context ?? DEFAULT_VALUE
}

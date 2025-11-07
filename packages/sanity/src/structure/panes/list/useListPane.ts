import {useContext} from 'react'

import {ListPaneContext, type ListPaneContextValue} from './ListPaneContext'

/** @internal */
export function useListPane(): ListPaneContextValue {
  const pane = useContext(ListPaneContext)
  if (!pane) {
    throw new Error('useListPane must be used within a ListPane component')
  }
  return pane
}

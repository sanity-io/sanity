import {type PaneLayoutContextValue} from './types'
import {useContext} from 'react'
import {PaneLayoutContext} from 'sanity/_singletons'

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function usePaneLayout(): PaneLayoutContextValue {
  const pane = useContext(PaneLayoutContext)

  if (!pane) {
    throw new Error('PaneLayout: missing context value')
  }

  return pane
}

import {type PaneRouterContextValue} from './types'
import {useContext} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'

/**
 *
 * @hidden
 * @beta
 */
export function usePaneRouter(): PaneRouterContextValue {
  return useContext(PaneRouterContext)
}

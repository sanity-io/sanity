import {useContext} from 'react'
import {PaneRouterContext} from './PaneRouterContext'
import {PaneRouterContextValue} from './types'

/**
 * @beta
 */
export function usePaneRouter(): PaneRouterContextValue {
  return useContext(PaneRouterContext)
}

import {useContext} from 'react'
import {PaneRouterContext} from './PaneRouterContext'
import type {PaneRouterContextValue} from './types'

/**
 * @public
 */
export function usePaneRouter(): PaneRouterContextValue {
  return useContext(PaneRouterContext)
}

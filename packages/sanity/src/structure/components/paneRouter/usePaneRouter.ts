import {useContext} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'

import {type PaneRouterContextValue} from './types'

// re-exported here so the public entry can surface the context without
// depending on sanity/_singletons directly (boundaries policy)
export {PaneRouterContext}

/**
 *
 * @hidden
 * @beta
 */
export function usePaneRouter(): PaneRouterContextValue {
  return useContext(PaneRouterContext)
}

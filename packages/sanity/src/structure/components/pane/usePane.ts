import {useContext} from 'react'
import {PaneContext} from 'sanity/_singletons'

import {type PaneContextValue} from './types'

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function usePane(): PaneContextValue {
  const pane = useContext(PaneContext)

  if (!pane) {
    throw new Error('Pane: missing context value')
  }

  return pane
}

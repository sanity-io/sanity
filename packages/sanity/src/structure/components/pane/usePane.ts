import {type PaneContextValue} from './types'
import {useContext} from 'react'
import {PaneContext} from 'sanity/_singletons'

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

import {useContext} from 'react'
import {IsLastPaneContext} from 'sanity/_singletons'

/**
 * @internal
 * @hidden
 */
export function useIsLastPane(): boolean {
  return useContext(IsLastPaneContext)
}

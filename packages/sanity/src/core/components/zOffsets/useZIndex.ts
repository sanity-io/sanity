import {useContext} from 'react'
import {ZIndexContext, type ZIndexContextValue} from 'sanity/_singleton'

/**
 * TODO: Rename to `useZOffsets`
 *
 * @internal
 */
export function useZIndex(): ZIndexContextValue {
  return useContext(ZIndexContext)
}

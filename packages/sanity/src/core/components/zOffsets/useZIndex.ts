import {type ZIndexContextValue} from './types'
import {useContext} from 'react'
import {ZIndexContext} from 'sanity/_singletons'

/**
 * TODO: Rename to `useZOffsets`
 *
 * @internal
 */
export function useZIndex(): ZIndexContextValue {
  return useContext(ZIndexContext)
}

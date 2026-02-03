import {useContext} from 'react'
import {ZIndexContext} from 'sanity/_singletons'

import {type ZIndexContextValue} from './types'

/**
 * TODO: Rename to `useZOffsets`
 *
 * @internal
 */
export function useZIndex(): ZIndexContextValue {
  return useContext(ZIndexContext)
}

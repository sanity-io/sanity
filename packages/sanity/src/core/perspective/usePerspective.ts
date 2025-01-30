import {useContext} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {type PerspectiveContextValue} from './types'

/**
 * @internal
 */
export function usePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  if (!context) {
    throw new Error('usePerspective must be used within a PerspectiveProvider')
  }
  return context
}

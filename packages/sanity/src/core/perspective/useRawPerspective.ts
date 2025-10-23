import {useContext} from 'react'
import {RawPerspectiveContext} from 'sanity/_singletons'

import {type RawPerspectiveContextValue} from './types'

/**
 * @internal
 *
 * Unlike `usePerspective`, this hook returns the actual URL perspective values without
 * any mapping.
 */
export function useRawPerspective(): RawPerspectiveContextValue {
  const context = useContext(RawPerspectiveContext)
  if (!context) {
    throw new Error('useRawPerspective must be used within a GlobalPerspectiveProvider')
  }
  return context
}

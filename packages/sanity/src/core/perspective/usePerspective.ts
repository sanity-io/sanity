import {useContext} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {type PerspectiveContextValue} from './types'

/**
 * @beta
 *
 * React hook that returns the current studio perspective and perspective stack.
 *
 * This will use the closest PerspectiveContext provider, which is either the global
 * PerspectiveContext or the DocumentPerspectiveProvider.
 *
 * @returns See {@link PerspectiveContextValue}
 * @example Reading the current perspective stack
 * ```ts
 * function MyComponent() {
 *  const {perspectiveStack} = usePerspective()
 *  // ... do something with the perspective stack , like passing it to the client perspective.
 * }
 * ```
 */
export function usePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  if (!context) {
    throw new Error('usePerspective must be used within a PerspectiveProvider')
  }
  return context
}

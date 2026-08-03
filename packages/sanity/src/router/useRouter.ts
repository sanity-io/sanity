import {useContext} from 'react'
import {RouterContext} from 'sanity/_singletons'

import {type RouterContextValue} from './types'

// re-exported here so the public entry can surface the context without
// depending on sanity/_singletons directly (boundaries policy)
export {RouterContext}

/**
 * Returns the router context value.
 * @public
 *
 * @returns The router context value.
 *  {@link RouterContextValue}
 * @throws An error if the router context value is missing.
 *
 * @example
 * ```tsx
 * const router = useRouter()
 * ```
 */
export function useRouter(): RouterContextValue {
  const router = useContext(RouterContext)

  if (!router) {
    throw new Error('Router: missing context value')
  }

  return router
}

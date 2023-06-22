import {useContext} from 'react'
import {RouterContext} from './RouterContext'
import {RouterContextValue} from './types'

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

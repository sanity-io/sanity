import {useContext} from 'react'
import {RouterContext} from './RouterContext'
import {RouterContextValue} from './types'

/**
 * @public
 */
export function useRouter(): RouterContextValue {
  const router = useContext(RouterContext)

  if (!router) {
    throw new Error('Router: missing context value')
  }

  return router
}

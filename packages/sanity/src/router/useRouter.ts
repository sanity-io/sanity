import {useContext} from 'react'
import {RouterContext} from './RouterContext'
import {RouterContextValue} from './types'

/**
 * @public
 */
export function useRouter(): RouterContextValue {
  // @TODO what uses this hook? If decoupling, can we remove it? Maybe keep it but note it's deprecated
  const router = useContext(RouterContext)

  if (!router) {
    throw new Error('Router: missing context value')
  }

  return router
}

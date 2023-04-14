import {identity} from 'lodash'
import {useMemo} from 'react'
import {RouterState} from './types'
import {useRouter} from './useRouter'

/**
 * @public
 */
export function useRouterState<R = RouterState>(selector: (routerState: RouterState) => R): R

/**
 * @public
 */
export function useRouterState(): RouterState

/**
 * @public
 */
export function useRouterState(
  selector: (routerState: RouterState) => unknown = identity
): unknown {
  const {state} = useRouter()
  return useMemo(() => selector(state), [selector, state])
}

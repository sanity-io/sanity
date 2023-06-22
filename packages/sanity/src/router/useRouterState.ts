import {identity} from 'lodash'
import {useMemo} from 'react'
import {RouterState} from './types'
import {useRouter} from './useRouter'

/**
 * @public
 *
 * @param selector - A selector function that receives the router state and returns a value. See {@link RouterState}
 *
 * @returns The value returned by the selector function or RouterState. See {@link RouterState}
 *
 * @example
 * ```tsx
 * const {activeTool} = useRouterState(state => state.tool)
 * ```
 */
export function useRouterState<R = RouterState>(selector: (routerState: RouterState) => R): R

/**
 * @public
 *
 * @returns The router state. See {@link RouterState}
 *
 * @example
 * ```tsx
 * const routerState = useRouterState()
 * ```
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

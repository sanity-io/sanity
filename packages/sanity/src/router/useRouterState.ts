import {identity} from 'lodash'
import {startTransition, useEffect, useState} from 'react'
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
  const [selectedState, setState] = useState(() => selector(state))

  // reset the state when the `selector` prop changes
  useEffect(() => startTransition(() => setState(selector(state))), [selector, state])

  return selectedState
}

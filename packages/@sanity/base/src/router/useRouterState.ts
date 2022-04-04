import {identity} from 'lodash'
import {useEffect, useState} from 'react'
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
  useEffect(() => setState(selector(state)), [selector, state])

  // TODO
  // update the state via a subscription
  // useEffect(() => {
  //   // prevents "Can't perform a React state update on an unmounted component."
  //   const mounted = {current: true}

  //   const unsubscribe = channel.subscribe(() => {
  //     if (mounted.current) {
  //       setState(selector(state))
  //     }
  //   })

  //   return () => {
  //     mounted.current = false
  //     unsubscribe()
  //   }
  // }, [channel, selector, getState])

  return selectedState
}

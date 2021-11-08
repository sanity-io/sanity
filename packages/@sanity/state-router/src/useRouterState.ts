import {identity} from 'lodash'
import {useContext, useEffect, useState} from 'react'
import {RouterState} from './components/types'
import {RouterContext} from './RouterContext'

export function useRouterState<R = RouterState>(selector: (routerState: RouterState) => R): R
export function useRouterState(): RouterState
export function useRouterState(
  selector: (routerState: RouterState) => unknown = identity
): unknown {
  const {channel, getState} = useContext(RouterContext)
  const [selectedState, setState] = useState(() => selector(getState()))

  // reset the state when the `selector` prop changes
  useEffect(() => setState(selector(getState())), [selector, getState])

  // update the state via a subscription
  useEffect(() => {
    // prevents "Can't perform a React state update on an unmounted component."
    const mounted = {current: true}

    const unsubscribe = channel.subscribe(() => {
      if (mounted.current) {
        setState(selector(getState()))
      }
    })

    return () => {
      mounted.current = false
      unsubscribe()
    }
  }, [channel, selector, getState])

  return selectedState
}

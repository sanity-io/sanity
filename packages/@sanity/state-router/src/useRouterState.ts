import {useContext, useEffect, useState, useRef} from 'react'
import {identity} from 'lodash'
import {RouterState} from './components/types'
import {RouterContext} from './RouterContext'

export const useRouterState = <R = RouterState>(
  selector: (routerState: RouterState) => R = identity
): R | null => {
  const {channel, getState} = useContext(RouterContext)
  const [selectedState, setState] = useState<R>(() => selector(getState()))

  // prevents "Can't perform a React state update on an unmounted component."
  const mountedRef = useRef(true)
  useEffect(() => {
    // runs during the cleanup phase when this components unmounts
    return () => {
      mountedRef.current = false
    }
  }, [])

  // reset the state when the `selector` prop changes
  useEffect(() => setState(selector(getState())), [selector, getState])

  useEffect(() => {
    // subscribe() returns an unsubscribe function, so this'll handle unmounting
    return channel.subscribe(() => {
      if (mountedRef.current) {
        setState(selector(getState()))
      }
    })
  }, [channel, getState, selector])

  return selectedState
}

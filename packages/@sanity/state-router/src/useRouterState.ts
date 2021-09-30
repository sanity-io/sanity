import {useContext, useEffect, useState, useRef} from 'react'
import {RouterState} from './components/types'
import {RouterContext} from './RouterContext'

export const useRouterState = (): RouterState | null => {
  const {channel, getState} = useContext(RouterContext)
  const [routerState, setState] = useState<RouterState>(getState())

  // prevents "Can't perform a React state update on an unmounted component."
  const mountedRef = useRef(true)
  useEffect(() => {
    // runs during the cleanup phase when this components unmounts
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // subscribe() returns an unsubscribe function, so this'll handle unmounting
    return channel.subscribe(() => {
      if (mountedRef.current) {
        setState(getState())
      }
    })
  }, [channel, getState])

  return routerState
}

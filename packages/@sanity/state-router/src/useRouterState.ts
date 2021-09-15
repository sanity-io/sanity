import {useContext, useEffect, useState} from 'react'
import {RouterState} from './components/types'
import {RouterContext} from './RouterContext'

export const useRouterState = (): RouterState => {
  const {channel, getState} = useContext(RouterContext)
  const [routerState, setState] = useState<RouterState>(getState())

  useEffect(() => {
    // subscribe() returns an unsubscribe function, so this'll handle unmounting
    return channel.subscribe(() => {
      setState(getState())
    })
  }, [channel, getState])

  return routerState
}

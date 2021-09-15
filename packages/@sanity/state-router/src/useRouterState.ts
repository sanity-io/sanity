import {useContext, useEffect, useState} from 'react'
import {RouterState} from './components/types'
import {RouterContext} from './RouterContext'

export const useRouterState = (): RouterState => {
  const router = useContext(RouterContext)
  const [routerState, setState] = useState<RouterState>(router.getState())

  useEffect(() => {
    // subscribe() returns an unsubscribe function, so this'll handle unmounting
    return router.channel.subscribe(() => {
      setState(router.getState())
    })
  }, [router])

  return routerState
}

import React, {useContext, useState, useEffect} from 'react'
import {InternalRouter} from './components/types'

const missingContext = () => {
  throw new Error('No router context provider found')
}

const missingRouter: InternalRouter = {
  channel: {subscribe: missingContext, publish: missingContext},
  getState: missingContext,
  navigate: missingContext,
  navigateIntent: missingContext,
  navigateUrl: missingContext,
  resolveIntentLink: missingContext,
  resolvePathFromState: missingContext,
}

export const RouterContext = React.createContext(missingRouter)
export const useRouter = () => useContext(RouterContext)
export const useRouterState = (deps?: string[]) => {
  const router = useContext(RouterContext)
  const [routerState, setState] = useState(router.getState())

  let dependencies
  if (deps) {
    dependencies = deps.map((key) => routerState[key])
  }

  // subscribe() returns an unsubscribe function, so this'll handle unmounting
  useEffect(() => router.channel.subscribe(() => setState(router.getState())), dependencies)

  return routerState
}

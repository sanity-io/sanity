import {useRouterState, useRouter} from '@sanity/base/router'
import {Router} from './types'

export function useDefaultLayoutRouter(): Router {
  const routerState = useRouterState()
  const {navigate} = useRouter()

  return {
    state: {tool: routerState.tool, space: routerState.space},
    navigate,
  }
}

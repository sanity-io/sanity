import {useRouterState, useRouter} from '@sanity/base/router'
import {useMemo} from 'react'
import {Router} from './types'

export function useDefaultLayoutRouter(): Router {
  const routerState = useRouterState()
  const {navigate} = useRouter()
  const tool = routerState?.tool
  const space = routerState?.space
  const state = useMemo(() => ({space, tool}), [space, tool])

  return useMemo(() => ({state, navigate}), [navigate, state])
}

import {useRouterState, useRouter} from '@sanity/base/router'
import {useMemo, useCallback} from 'react'
import {Router} from './types'

export function useDefaultLayoutRouter(): Router {
  const {navigate} = useRouter()
  const tool = useRouterState(useCallback((routerState) => routerState?.tool, []))
  const space = useRouterState(useCallback((routerState) => routerState?.space, []))
  const state = useMemo(() => ({tool, space}), [tool, space])

  return useMemo(() => ({state, navigate}), [navigate, state])
}

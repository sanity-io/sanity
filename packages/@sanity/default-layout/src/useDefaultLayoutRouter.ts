import {useRouterState, useRouter, RouterState} from '@sanity/base/router'
import {useMemo} from 'react'
import {Router} from './types'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function getSpace(routerState?: RouterState) {
  const value = routerState?.space

  return isString(value) ? value : undefined
}

function getTool(routerState?: RouterState) {
  const value = routerState?.tool

  return isString(value) ? value : undefined
}

export function useDefaultLayoutRouter(): Router {
  const {navigate} = useRouter()
  const space = useRouterState(getSpace)
  const tool = useRouterState(getTool)
  const state = useMemo(() => ({tool, space}), [tool, space])

  return useMemo(() => ({state, navigate}), [navigate, state])
}

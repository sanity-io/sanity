/* eslint-disable camelcase */

import React, {useCallback, useMemo} from 'react'
import {isEmpty} from './utils/isEmpty'
import {RouterContext} from './RouterContext'
import {NavigateOptions, RouterContextValue} from './types'
import {useRouter} from './useRouter'

function addScope(
  routerState: Record<string, any>,
  scope: string,
  scopedState: Record<string, any>
) {
  return (
    scopedState && {
      ...routerState,
      [scope]: scopedState,
    }
  )
}

/**
 * @public
 */
export interface RouteScopeProps {
  scope: string
  children: React.ReactNode
}

/**
 * @public
 */
export function RouteScope(props: RouteScopeProps): React.ReactElement {
  const {children, scope} = props
  const parent = useRouter()
  const {resolvePathFromState: parent_resolvePathFromState, navigate: parent_navigate} = parent

  const resolvePathFromState = useCallback(
    (nextState: Record<string, any>): string => {
      const nextStateScoped: Record<string, any> = isEmpty(nextState)
        ? {}
        : addScope(parent.state, scope, nextState)

      return parent_resolvePathFromState(nextStateScoped)
    },
    [parent_resolvePathFromState, parent.state, scope]
  )

  const navigate = useCallback(
    (nextState: Record<string, any>, options?: NavigateOptions): void => {
      const nextScopedState = addScope(parent.state, scope, nextState)
      parent_navigate(nextScopedState, options)
    },
    [parent_navigate, parent.state, scope]
  )

  const scopedRouter: RouterContextValue = useMemo(
    () => ({
      ...parent,
      navigate,
      resolvePathFromState,
      state: parent.state[scope] as any,
    }),
    [navigate, parent, resolvePathFromState, scope]
  )

  return <RouterContext.Provider value={scopedRouter}>{children}</RouterContext.Provider>
}

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
 * The props for the {@link RouteScope} component.
 *
 * @public
 */
export interface RouteScopeProps {
  /**
   * The scope for the nested routes.
   */
  scope: string
  /**
   * The content to display inside the route scope.
   */
  children: React.ReactNode
}

/**
 * A component that creates a new router scope with a given scope name.
 *
 * @public
 *
 * @param props - The component props.
 *  {@link RouteScopeProps}
 * @returns A React element representing the new router scope.
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

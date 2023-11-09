/* eslint-disable camelcase */

import React, {useCallback, useMemo, useRef} from 'react'
import {isEmpty} from './utils/isEmpty'
import {RouterContext} from './RouterContext'
import {NavigateOptions, RouterContextValue} from './types'
import {useRouter} from './useRouter'

function addScope(
  routerState: Record<string, any>,
  scope: string,
  scopedState: Record<string, any>,
) {
  return (
    scopedState && {
      ...routerState,
      [scope]: scopedState,
    }
  )
}

/**
 * Props for the {@link RouteScope} component.
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
 * A component that wraps a scoped router context, so that calls to
 * `useRouter()`, `useRouterState()`, and usage of `<StateLink />`
 * will be prefixed with the scope segment.
 *
 * @public
 *
 * @param props - Props to pass `RouteScope` component.
 *  See {@link RouteScopeProps}
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *  return (
 *    <RouteScope scope="foo">
 *      <StateLink state={{bar: 'baz'}}>Link</StateLink>
 *    </RouteScope>
 *  )
 * }
 * ```
 */
export function RouteScope(props: RouteScopeProps): React.ReactElement {
  const {children, scope} = props
  const parent = useRouter()
  const {resolvePathFromState: parent_resolvePathFromState, navigate: parent_navigate} = parent

  const parentStateRef = useRef(parent.state)

  parentStateRef.current = parent.state

  const resolvePathFromState = useCallback(
    (nextState: Record<string, any>): string => {
      const nextStateScoped: Record<string, any> = isEmpty(nextState)
        ? {}
        : addScope(parentStateRef.current, scope, nextState)

      return parent_resolvePathFromState(nextStateScoped)
    },
    [parent_resolvePathFromState, scope],
  )

  const navigate = useCallback(
    (nextState: Record<string, any>, options?: NavigateOptions): void => {
      const nextScopedState = addScope(parentStateRef.current, scope, nextState)
      parent_navigate(nextScopedState, options)
    },
    [parent_navigate, scope],
  )

  const scopedRouter: RouterContextValue = useMemo(
    () => ({
      ...parent,
      navigate,
      resolvePathFromState,
      state: parent.state[scope] as any,
    }),
    [navigate, parent, resolvePathFromState, scope],
  )

  return <RouterContext.Provider value={scopedRouter}>{children}</RouterContext.Provider>
}

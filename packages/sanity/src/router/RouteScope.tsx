/* eslint-disable camelcase */

import React, {useCallback, useMemo, useRef} from 'react'
import {RouterContext} from './RouterContext'
import {RouterContextValue, RouterState} from './types'
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
   * Optionally disable scoping of search params
   * Scoped search params will be represented as scope[param]=value in the url
   * Disabling this will still scope search params based on any parent scope unless the parent scope also has disabled search params scoping
   * Caution: enabling this can cause conflicts with multiple plugins defining search params with the same name
   */
  __unsafe_disableScopedSearchParams?: boolean
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
  const {children, scope, __unsafe_disableScopedSearchParams} = props
  const parentRouter = useRouter()
  const {resolvePathFromState: parent_resolvePathFromState, navigate: parent_navigate} =
    parentRouter

  const parentStateRef = useRef(parentRouter.state)

  parentStateRef.current = parentRouter.state

  const resolveNextParentState = useCallback(
    (_nextState: RouterState) => {
      const {_searchParams, ...nextState} = _nextState
      const nextParentState = addScope(parentStateRef.current, scope, nextState)
      if (__unsafe_disableScopedSearchParams) {
        // Move search params to parent scope
        nextParentState._searchParams = _searchParams
      } else {
        nextParentState[scope]._searchParams = _searchParams
      }
      return nextParentState
    },
    [scope, __unsafe_disableScopedSearchParams],
  )

  const resolvePathFromState = useCallback(
    (nextState: RouterState) => parent_resolvePathFromState(resolveNextParentState(nextState)),
    [parent_resolvePathFromState, resolveNextParentState],
  )

  const navigate = useCallback(
    (nextState: RouterState) => parent_navigate(resolveNextParentState(nextState)),
    [parent_navigate, resolveNextParentState],
  )

  const childRouter: RouterContextValue = useMemo(() => {
    const parentState = parentRouter.state
    const childState = {...(parentState[scope] || {})} as RouterState
    if (__unsafe_disableScopedSearchParams) {
      childState._searchParams = parentState._searchParams
    }
    return {
      ...parentRouter,
      navigate,
      resolvePathFromState,
      state: childState,
    }
  }, [scope, parentRouter, navigate, resolvePathFromState, __unsafe_disableScopedSearchParams])

  return <RouterContext.Provider value={childRouter}>{children}</RouterContext.Provider>
}

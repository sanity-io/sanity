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
  const parent = useRouter()
  const {resolvePathFromState: parent_resolvePathFromState, navigate: parent_navigate} = parent

  const parentStateRef = useRef(parent.state)

  parentStateRef.current = parent.state

  const resolvePathFromState = useCallback(
    (_nextState: Record<string, any>) => {
      const {_searchParams, ...nextState} = _nextState
      const nextScopedState = addScope(parentStateRef.current, scope, nextState)
      if (__unsafe_disableScopedSearchParams) {
        // Move search params to parent scope
        nextScopedState._searchParams = _searchParams
      } else {
        nextScopedState[scope]._searchParams = _searchParams
      }
      return parent_resolvePathFromState(nextScopedState)
    },
    [scope, __unsafe_disableScopedSearchParams, parent_resolvePathFromState],
  )

  const navigate = useCallback(
    (_nextState: Record<string, any>, options?: NavigateOptions): void => {
      const {_searchParams, ...nextState} = _nextState
      const nextScopedState = addScope(parentStateRef.current, scope, nextState)
      if (__unsafe_disableScopedSearchParams) {
        // move search params to parent scope
        nextScopedState._searchParams = _searchParams
      } else {
        nextScopedState[scope]._searchParams = _searchParams
      }
      parent_navigate(nextScopedState, options)
    },
    [scope, __unsafe_disableScopedSearchParams, parent_navigate],
  )

  const scopedRouter: RouterContextValue = useMemo(() => {
    const parentState = parent.state
    const scopedState = {...(parentState[scope] || {})} as Record<string, unknown>
    if (__unsafe_disableScopedSearchParams) {
      scopedState._searchParams = parentState._searchParams
    }
    return {
      ...parent,
      navigate,
      resolvePathFromState,
      state: scopedState,
    }
  }, [navigate, parent, __unsafe_disableScopedSearchParams, resolvePathFromState, scope])

  return <RouterContext.Provider value={scopedRouter}>{children}</RouterContext.Provider>
}

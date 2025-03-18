/* eslint-disable camelcase */
import {type ReactNode, useCallback, useEffect, useMemo, useRef} from 'react'
import {RouterContext} from 'sanity/_singletons'

import {
  isNavigateOptions,
  type NavigateOptions,
  type NextStateOrOptions,
  type RouterContextValue,
  type RouterState,
} from './types'
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
  children: ReactNode
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
export const RouteScope = function RouteScope(props: RouteScopeProps): React.JSX.Element {
  const {children, scope, __unsafe_disableScopedSearchParams} = props
  const parentRouter = useRouter()
  const {resolvePathFromState: parent_resolvePathFromState, navigate: parent_navigate} =
    parentRouter

  const parentStateRef = useRef(parentRouter.state)
  useEffect(() => {
    parentStateRef.current = parentRouter.state
  }, [parentRouter.state])

  const resolveNextParentState = useCallback(
    (_nextState: RouterState | null) => {
      if (_nextState === null) return null

      const {_searchParams, ...nextState} = _nextState || {}
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
    (nextState: RouterState | null) =>
      parent_resolvePathFromState(resolveNextParentState(nextState)),
    [parent_resolvePathFromState, resolveNextParentState],
  )

  const navigate: RouterContextValue['navigate'] = useCallback(
    (nextStateOrOptions: NextStateOrOptions, maybeOptions?: NavigateOptions) => {
      // Check if it's the options-only pattern
      if (isNavigateOptions(nextStateOrOptions) && !maybeOptions) {
        const options = nextStateOrOptions
        const {state} = options

        //keep the current state but apply other options
        if (state) {
          const nextState = resolveNextParentState(state)
          const resolvedState = nextState === null ? {} : nextState

          return parent_navigate(resolvedState, options)
        }

        //keep the current state
        return parent_navigate(options)
      }

      const nextState = isNavigateOptions(nextStateOrOptions)
        ? resolveNextParentState(null)
        : resolveNextParentState(nextStateOrOptions)

      return parent_navigate(nextState === null ? {} : nextState, maybeOptions || {})
    },
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
RouteScope.displayName = 'RouteScope'

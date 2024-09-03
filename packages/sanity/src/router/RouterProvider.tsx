import {fromPairs, partition, toPairs} from 'lodash'
import {type ReactElement, type ReactNode, useCallback, useMemo} from 'react'
import {RouterContext} from 'sanity/_singletons'

import {STICKY_PARAMS} from './stickyParams'
import {
  type IntentParameters,
  type NavigateOptions,
  type Router,
  type RouterContextValue,
  type RouterState,
  type SearchParam,
} from './types'

/**
 * The props for the {@link RouterProvider} component.
 *
 * @public
 */
export interface RouterProviderProps {
  /**
   * A function that is called when the user navigates to a new path.
   * Takes an object containing the path to navigate to and an optional `replace` flag.
   */
  onNavigate: (opts: {path: string; replace?: boolean}) => void
  /**
   * The router object that is used to handle navigation. See {@link Router}
   */
  router: Router
  /**
   * The current state of the router. See {@link RouterState}
   */
  state: RouterState
  /**
   * The child elements to render.
   */
  children: ReactNode
}

/**
 * @example
 * ```tsx
 * import {
 *   NavigateOptions,
 *   route,
 *   RouterProvider,
 *   RouterState
 * } from 'sanity'
 * import {useCallback, useMemo} from 'react'
 *
 * function Root() {
 *   const router = useMemo(() => route.create('/'), [])
 *
 *   const [state, setState] = useState<RouterState>({})
 *
 *   const handleNavigate = useCallback((
 *     path: string,
 *     options?: NavigateOptions
 *   ) => {
 *     console.log('navigate', path, options)
 *
 *     setState(router.decode(path))
 *   }, [router])
 *
 *   return (
 *     <RouterProvider
 *       onNavigate={handleNavigate}
 *       router={router}
 *       state={state}
 *     >
 *       <div>This is a routed application</div>
 *     </RouterProvider>
 *   )
 * }
 * ```
 *
 * @param props - The component props.
 *  {@link RouterProviderProps}
 *
 * @public
 */
export function RouterProvider(props: RouterProviderProps): ReactElement {
  const {onNavigate, router: routerProp, state} = props

  const resolveIntentLink = useCallback(
    (intentName: string, parameters?: IntentParameters, _searchParams?: SearchParam[]): string => {
      const [params, payload] = Array.isArray(parameters) ? parameters : [parameters]
      return routerProp.encode({
        intent: intentName,
        params,
        payload,
        _searchParams: toPairs({
          ...fromPairs((state._searchParams ?? []).filter(([key]) => STICKY_PARAMS.includes(key))),
          ...fromPairs(_searchParams ?? []),
        }),
      })
    },
    [routerProp, state._searchParams],
  )

  const resolvePathFromState = useCallback(
    (nextState: RouterState): string => {
      const currentStateParams = state._searchParams || []
      const nextStateParams = nextState._searchParams || []
      const nextParams = STICKY_PARAMS.reduce((acc, param) => {
        return replaceStickyParam(
          acc,
          param,
          findParam(nextStateParams, param) ?? findParam(currentStateParams, param),
        )
      }, nextStateParams || [])

      return routerProp.encode({
        ...nextState,
        _searchParams: nextParams,
      })
    },
    [routerProp, state],
  )

  const handleNavigateStickyParam = useCallback(
    (param: string, value: string | undefined, options: NavigateOptions = {}) => {
      if (!STICKY_PARAMS.includes(param)) {
        throw new Error('Parameter is not sticky')
      }
      onNavigate({
        path: resolvePathFromState({
          ...state,
          _searchParams: [[param, value || '']],
        }),
        replace: options.replace,
      })
    },
    [onNavigate, resolvePathFromState, state],
  )

  const navigate = useCallback(
    (nextState: Record<string, unknown>, options: NavigateOptions = {}) => {
      onNavigate({path: resolvePathFromState(nextState), replace: options.replace})
    },
    [onNavigate, resolvePathFromState],
  )

  const navigateIntent = useCallback(
    (intentName: string, params?: IntentParameters, options: NavigateOptions = {}) => {
      onNavigate({path: resolveIntentLink(intentName, params), replace: options.replace})
    },
    [onNavigate, resolveIntentLink],
  )

  const [routerState, stickyParams] = useMemo(() => {
    if (!state._searchParams) {
      return [state, null]
    }
    const {_searchParams, ...rest} = state
    const [sticky, restParams] = partition(_searchParams, ([key]) => STICKY_PARAMS.includes(key))
    if (sticky.length === 0) {
      return [state, null]
    }
    return [{...rest, _searchParams: restParams}, sticky]
  }, [state])

  const router: RouterContextValue = useMemo(
    () => ({
      navigate,
      navigateIntent,
      navigateStickyParam: handleNavigateStickyParam,
      navigateUrl: onNavigate,
      resolveIntentLink,
      resolvePathFromState,
      state: routerState,
      stickyParams: Object.fromEntries(stickyParams || []),
    }),
    [
      handleNavigateStickyParam,
      navigate,
      navigateIntent,
      onNavigate,
      resolveIntentLink,
      resolvePathFromState,
      routerState,
      stickyParams,
    ],
  )

  return <RouterContext.Provider value={router}>{props.children}</RouterContext.Provider>
}

function replaceStickyParam(
  current: SearchParam[],
  param: string,
  value: string | undefined,
): SearchParam[] {
  const filtered = current.filter(([key]) => key !== param)
  return value === undefined || value == '' ? filtered : [...filtered, [param, value]]
}

function findParam(searchParams: SearchParam[], key: string): string | undefined {
  const entry = searchParams.find(([k]) => k === key)
  return entry ? entry[1] : undefined
}

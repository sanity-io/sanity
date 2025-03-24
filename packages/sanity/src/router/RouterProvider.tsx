import {fromPairs, partition, toPairs} from 'lodash'
import {type ReactNode, useCallback, useMemo} from 'react'
import {RouterContext} from 'sanity/_singletons'

import {STICKY_PARAMS} from './stickyParams'
import {
  type IntentParameters,
  isNavigateOptions,
  type NavigateBaseOptions,
  type NavigateOptions,
  type NextStateOrOptions,
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
 *   const [router] = useState(() => route.create('/'))
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
export function RouterProvider(props: RouterProviderProps): React.JSX.Element {
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
    (nextState: RouterState | null): string => {
      const currentStateParams = state._searchParams || []
      const nextStateParams = nextState?._searchParams || []
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

  const navigate: RouterContextValue['navigate'] = useCallback(
    (nextStateOrOptions: NextStateOrOptions, maybeOptions?: NavigateOptions) => {
      // Determine options and state based on input pattern
      const isOptionsOnlyPattern = isNavigateOptions(nextStateOrOptions) && !maybeOptions
      const options = isOptionsOnlyPattern ? nextStateOrOptions : maybeOptions || {}

      const baseState = isNavigateOptions(nextStateOrOptions)
        ? (getStateFromOptions(nextStateOrOptions, state) ?? state)
        : nextStateOrOptions

      const currentParams = state._searchParams || []
      const nextStickyParams =
        options.stickyParams ??
        Object.fromEntries(currentParams.filter(([key]) => STICKY_PARAMS.includes(key)))

      validateStickyParams(nextStickyParams)

      const nextParams = baseState._searchParams || []
      const mergedParams = mergeStickyParams(nextParams, nextStickyParams)

      onNavigate({
        path: resolvePathFromState({...baseState, _searchParams: mergedParams}),
        replace: options.replace,
      })
    },
    [onNavigate, resolvePathFromState, state],
  )

  const handleNavigateStickyParams = useCallback(
    (params: NavigateOptions['stickyParams'], options: NavigateBaseOptions = {}) =>
      navigate({stickyParams: params, ...options, state: undefined}),
    [navigate],
  )

  const navigateIntent = useCallback(
    (intentName: string, params?: IntentParameters, options: NavigateBaseOptions = {}) => {
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

  const stickyParamsByName = useMemo(() => Object.fromEntries(stickyParams || []), [stickyParams])

  const router: RouterContextValue = useMemo(
    () => ({
      navigate,
      navigateIntent,
      navigateStickyParams: handleNavigateStickyParams,
      navigateUrl: onNavigate,
      resolveIntentLink,
      resolvePathFromState,
      state: routerState,
      stickyParams: stickyParamsByName,
    }),
    [
      handleNavigateStickyParams,
      navigate,
      navigateIntent,
      onNavigate,
      resolveIntentLink,
      resolvePathFromState,
      routerState,
      stickyParamsByName,
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

function mergeStickyParams(
  currentParams: SearchParam[],
  newParams?: Record<string, string | undefined | null>,
): SearchParam[] {
  if (!newParams) return currentParams

  // Remove old sticky params before merging new ones
  const filteredParams = currentParams.filter(([key]) => !Object.hasOwn(newParams, key))

  // Type guard function to filter out undefined values
  const isValidSearchParam = (
    entry: [string, string | undefined | null],
  ): entry is [string, string] => entry[1] !== undefined

  const convertNullSearchParam = (entry: [string, string | null]): [string, string] => [
    entry[0],
    entry[1] === null ? '' : entry[1],
  ]

  // Convert newParams into the correct SearchParam format
  const newEntries = Object.entries(newParams)
    .filter(isValidSearchParam)
    .map(convertNullSearchParam)

  return [...filteredParams, ...newEntries]
}

function findParam(searchParams: SearchParam[], key: string): string | undefined {
  const entry = searchParams.find(([k]) => k === key)
  return entry ? entry[1] : undefined
}

function getStateFromOptions(
  nextStateOrOptions: NextStateOrOptions,
  state: RouterState,
): RouterState | null {
  const isOptionsOnly = isNavigateOptions(nextStateOrOptions)

  if (isOptionsOnly) {
    if (nextStateOrOptions.state === null) {
      return {}
    }
    return nextStateOrOptions.state ?? state
  }
  return null
}

function validateStickyParams(nextStickyParams: Record<string, string | undefined | null>) {
  const hasInvalidParam = Object.keys(nextStickyParams).some(
    (param) => !STICKY_PARAMS.includes(param),
  )
  if (hasInvalidParam) throw new Error('One or more parameters are not sticky')
}

import React, {useCallback, useMemo} from 'react'
import {RouterContext} from './RouterContext'
import {IntentParameters, RouterContextValue, NavigateOptions, Router, RouterState} from './types'

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
  children: React.ReactNode
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
export function RouterProvider(props: RouterProviderProps): React.ReactElement {
  const {onNavigate, router: routerProp, state} = props

  const resolveIntentLink = useCallback(
    (intentName: string, parameters?: IntentParameters): string => {
      const [params, payload] = Array.isArray(parameters) ? parameters : [parameters]
      return routerProp.encode({intent: intentName, params, payload})
    },
    [routerProp]
  )

  const resolvePathFromState = useCallback(
    (nextState: Record<string, unknown>): string => {
      return routerProp.encode(nextState)
    },
    [routerProp]
  )

  const navigate = useCallback(
    (nextState: Record<string, unknown>, options: NavigateOptions = {}) => {
      onNavigate({path: resolvePathFromState(nextState), replace: options.replace})
    },
    [onNavigate, resolvePathFromState]
  )

  const navigateIntent = useCallback(
    (intentName: string, params?: IntentParameters, options: NavigateOptions = {}) => {
      onNavigate({path: resolveIntentLink(intentName, params), replace: options.replace})
    },
    [onNavigate, resolveIntentLink]
  )

  const router: RouterContextValue = useMemo(
    () => ({
      navigate,
      navigateIntent,
      navigateUrl: onNavigate,
      resolveIntentLink,
      resolvePathFromState,
      state,
    }),
    [navigate, navigateIntent, onNavigate, resolveIntentLink, resolvePathFromState, state]
  )

  return <RouterContext.Provider value={router}>{props.children}</RouterContext.Provider>
}

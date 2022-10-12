import {escapeRegExp, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useSyncExternalStore} from 'react'
import type {History} from 'history'
import type {Tool} from '../../config'
import {decodeUrlState, resolveDefaultState, resolveIntentState} from './helpers'
import type {RouterStateEvent} from './types'
import type {Router, RouterState} from 'sanity/router'

interface StudioRouterState {
  isNotFound: boolean
  state: RouterState
}

const isStateEvent = <T extends {type: string}>(e: T): e is Extract<T, {type: 'state'}> =>
  e.type === 'state'

const initialState: StudioRouterState = {isNotFound: true, state: {}}
const initialStateEvent: RouterStateEvent = {type: 'state', ...initialState}

/**
 * @internal
 */
export function useRouterState(
  history: History,
  router: Router | undefined,
  tools: Tool[] | undefined
): StudioRouterState {
  const shouldSkip = !router || !tools
  const location = useSyncExternalStore(
    history.listen,
    useCallback(() => history.location, [history])
  )
  const {pathname} = location
  const routerBasePath = useMemo(() => router?.getBasePath(), [router])
  const routerEvent = useMemo<RouterStateEvent>(() => {
    if (shouldSkip) {
      return initialStateEvent
    }

    // this is necessary to prevent emissions intended for other workspaces.
    //
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    const validPathname =
      routerBasePath === '/'
        ? true
        : new RegExp(`^${escapeRegExp(routerBasePath)}(\\/|$)`, 'i').test(pathname)
    return validPathname ? decodeUrlState(router, pathname) : initialStateEvent
  }, [pathname, router, routerBasePath, shouldSkip])

  const prevRouterEventRef = useRef(initialStateEvent)
  useEffect(() => {
    if (shouldSkip) return

    if (routerEvent?.type === 'state' && routerEvent.state?.intent) {
      const redirectState = resolveIntentState(
        tools,
        prevRouterEventRef.current?.type === 'state' ? prevRouterEventRef.current.state : {},
        routerEvent.state
      )

      if (redirectState?.type === 'state') {
        history.replace(router.encode(redirectState.state))
        // This will not push anything downstream and preserve the prevEvent for the next received value
        // Since we are calling history.replace here, a new event will be received immediately
        return
      }
    }
    prevRouterEventRef.current = routerEvent

    if (routerEvent?.type === 'state') {
      const defaultState = resolveDefaultState(tools, routerEvent.state)

      if (defaultState && defaultState !== routerEvent.state) {
        history.replace(router.encode(defaultState))
      }
    }
  }, [history, router, routerEvent, shouldSkip, tools])

  const routerStateRef = useRef<StudioRouterState>(initialState)
  if (!shouldSkip && isStateEvent(routerEvent) && !isEqual(routerEvent, routerStateRef.current)) {
    routerStateRef.current = routerEvent
  }

  const {isNotFound, state} = routerStateRef.current
  return useMemo<StudioRouterState>(
    () => ({
      isNotFound: isNotFound ?? initialStateEvent.isNotFound,
      state: state ?? initialStateEvent.state,
    }),
    [isNotFound, state]
  )
}

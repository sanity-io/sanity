import {escapeRegExp, isEqual} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector'
import type {Tool, Workspace} from '../../config'
import {createRouter, type RouterHistory} from '../router'
import {decodeUrlState, resolveDefaultState, resolveIntentState} from '../router/helpers'
import {useRouterHistory} from '../router/RouterHistoryContext'
import {type Router, RouterProvider, type RouterState} from 'sanity/router'

interface WorkspaceRouterProviderProps {
  children: React.ReactNode
  LoadingComponent: React.ComponentType
  workspace: Workspace
}

export function WorkspaceRouterProvider({
  children,
  LoadingComponent,
  workspace,
}: WorkspaceRouterProviderProps) {
  const {basePath, tools} = workspace
  const history = useRouterHistory()

  const handleNavigate = useCallback(
    (opts: {path: string; replace?: boolean}) => {
      if (opts.replace) {
        history.replace(opts.path)
      } else {
        history.push(opts.path)
      }
    },
    [history]
  )
  const router = useMemo(() => createRouter({basePath, tools}), [basePath, tools])
  const state = useRouterStateFromWorkspaceHistory(history, router, tools)

  // `state` is only null if the Studio is somehow rendering in SSR or using hydrateRoot in combination with `unstable_noAuthBoundary`.
  // Which makes this loading condition extremely rare, most of the time it'll render `RouteProvider` right away.
  if (!state) return <LoadingComponent />

  return (
    <RouterProvider onNavigate={handleNavigate} router={router} state={state}>
      {children}
    </RouterProvider>
  )
}

/**
 * @internal
 */
function useRouterStateFromWorkspaceHistory(
  history: RouterHistory,
  router: Router,
  tools: Tool[]
): RouterState | null {
  // React will only re-subscribe if store.subscribe changes identity, so by memoizing the whole store
  // we ensure that if any of the dependencies used by store.selector changes, we'll re-subscribe.
  // If we don't, we risk hot reload seeing stale workspace configs as the user is editing them.
  const store = useMemo(() => {
    const routerBasePath = router.getBasePath()
    // this regex ends with a `(\\/|$)` (forward slash or end) to prevent false
    // matches where the pathname is a false subset of the current pathname.
    const routerBasePathRegex = new RegExp(`^${escapeRegExp(routerBasePath)}(\\/|$)`, 'i')
    const shouldHandle = (pathname: string) =>
      // this is necessary to prevent emissions intended for other workspaces.
      routerBasePath === '/' ? true : routerBasePathRegex.test(pathname)
    return {
      subscribe: (onStoreChange: () => void) => history.listen(onStoreChange),
      getSnapshot: () => history.location.pathname,
      // Always return null for the server snapshot, as we can't know how to resolve intents until after authentication is done, which is browser-only
      getServerSnapshot: () => null,
      selector: (pathname: string | null) =>
        typeof pathname === 'string' && shouldHandle(pathname)
          ? decodeUrlState(router, pathname)
          : null,
    }
  }, [history, router])

  const event = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    store.selector,
    isEqual
  )

  const prevEvent = useRef(event)
  // Handles redirects to intents, e.g. `/test/intent/create/template=codeTest;type=codeTest/` -> `/test/content/input-plugin;codeTest;c7e1aa3e-5555-40f5-b0af-c7309df6edcc%2Ctemplate%3DcodeTest`
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (event?.type === 'state' && event.state?.intent) {
      const redirectState = resolveIntentState(
        tools,
        prevEvent.current?.type === 'state' ? prevEvent.current.state : {},
        event.state
      )

      if (redirectState?.type === 'state') {
        history.replace(router.encode(redirectState.state))
        // Since we are calling history.replace here, a new event will be received immediately and we want to preserve prevEvent
        return undefined
      }
    }
    prevEvent.current = event
  }, [event, history, router, tools])

  // Handles redirects from the root base path to the default tool, e.g. `/` -> `/desk`
  useEffect(() => {
    if (event?.type === 'state' && !event.state?.intent) {
      const defaultState = resolveDefaultState(tools, event.state)
      if (defaultState && defaultState !== event.state) {
        history.replace(router.encode(defaultState))
      }
    }
  }, [event?.state, event?.type, history, router, tools])

  return event?.state ?? null
}

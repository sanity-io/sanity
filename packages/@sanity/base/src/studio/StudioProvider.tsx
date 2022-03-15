import {RouterProvider, RouterState} from '@sanity/state-router'
import {LayerProvider, ThemeColorSchemeKey, ToastProvider} from '@sanity/ui'
import React, {useEffect, useMemo, useState} from 'react'
import {SanityConfig} from '../config'
import {SanityProvider} from '../sanity'
import {resolvePlugins, resolveProject, resolveSpaces, resolveTools} from './resolveConfig'
import {createLocationStore, createRouter, createRouterEventStream} from './router'
import {StudioContext, StudioContextValue} from './StudioContext'

interface StudioState {
  router: {
    isNotFound: boolean
    state: RouterState | null
  }
}

export function StudioProvider(props: {
  children?: React.ReactNode
  config: SanityConfig
  scheme: ThemeColorSchemeKey
  setScheme: React.Dispatch<React.SetStateAction<ThemeColorSchemeKey>>
}) {
  const {children, config, scheme, setScheme} = props
  const plugins = useMemo(() => resolvePlugins({plugins: config.plugins}), [config])
  const tools = useMemo(() => resolveTools({plugins, tools: config.tools}), [config, plugins])
  const project = useMemo(() => resolveProject({config}), [config])
  const spaces = useMemo(() => resolveSpaces({spaces: config.__experimental_spaces}), [config])
  const spaceNames = useMemo(() => spaces.map((s) => s.name), [spaces])
  const studio: StudioContextValue = useMemo(
    () => ({scheme, setScheme, spaces, tools}),
    [scheme, setScheme, spaces, tools]
  )
  const hasSpaces = spaces ? spaces.length > 1 : false
  const [state, setState] = useState<StudioState>({
    router: {isNotFound: true, state: null},
  })
  const locationStore = useMemo(() => createLocationStore(), [])
  const router = useMemo(
    () => createRouter({basePath: project.basePath, spaces: spaceNames, tools}),
    [project.basePath, spaceNames, tools]
  )
  const routerEvent$ = useMemo(() => {
    return createRouterEventStream(locationStore, hasSpaces, spaceNames, tools, router)
  }, [hasSpaces, locationStore, router, spaceNames, tools])

  useEffect(() => {
    const sub = routerEvent$.subscribe((event) => {
      if (event.type === 'state') {
        setState((prevState) => ({
          ...prevState,
          router: {
            isNotFound: event.isNotFound,
            state: event.state,
          },
        }))
      }
    })

    return () => sub.unsubscribe()
  }, [routerEvent$])

  // Maybe redirect to base
  useEffect(() => {
    const redirectTo = router.getRedirectBase(location.pathname)

    if (redirectTo) {
      history.replaceState(null, document.title, redirectTo)
    }
  }, [router])

  return (
    <SanityProvider config={config} scheme={scheme}>
      <StudioContext.Provider value={studio}>
        <LayerProvider>
          <ToastProvider>
            <RouterProvider
              // eslint-disable-next-line react/jsx-handler-names
              onNavigate={locationStore.navigate.call}
              router={router}
              state={state.router.state || {}}
            >
              {children}
            </RouterProvider>
          </ToastProvider>
        </LayerProvider>
      </StudioContext.Provider>
    </SanityProvider>
  )
}

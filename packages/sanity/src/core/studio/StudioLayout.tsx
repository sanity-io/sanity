/* eslint-disable i18next/no-literal-string, @sanity/i18n/no-attribute-template-literals */
import {Card, Flex} from '@sanity/ui'
import {startCase} from 'lodash'
import React, {
  createContext,
  createElement,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import styled from 'styled-components'
import {LoadingBlock} from '../components/loadingBlock'
import {NoToolsScreen} from './screens/NoToolsScreen'
import {RedirectingScreen} from './screens/RedirectingScreen'
import {ToolNotFoundScreen} from './screens/ToolNotFoundScreen'
import {useLayoutComponent, useNavbarComponent} from './studio-components-hooks'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {useWorkspace} from './workspace'
import {RouteScope, useRouter, useRouterState} from 'sanity/router'

const SearchFullscreenPortalCard = styled(Card)`
  height: 100%;
  left: 0;
  overflow: hidden;
  overflow: clip;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 200;
`

/** @internal */
export interface NavbarContextValue {
  onSearchFullscreenOpenChange: (open: boolean) => void
  onSearchOpenChange: (open: boolean) => void
  searchFullscreenOpen: boolean
  searchFullscreenPortalEl: HTMLElement | null
  searchOpen: boolean
}

/** @internal */
export const NavbarContext = createContext<NavbarContextValue>({
  onSearchFullscreenOpenChange: () => '',
  onSearchOpenChange: () => '',
  searchFullscreenOpen: false,
  searchFullscreenPortalEl: null,
  searchOpen: false,
})

/**
 * The Studio Layout component is the root component of the Sanity Studio UI.
 * It renders the navbar, the active tool, and the search modal as well as the error boundary.
 *
 * @public
 * @returns A Studio Layout element that renders the navbar, the active tool, and the search modal as well as the error boundary
 * @remarks This component should be used as a child component to the StudioProvider
 * @example Rendering a Studio Layout
 * ```ts
 * <StudioProvider
 *  basePath={basePath}
 *  config={config}
 *  onSchemeChange={onSchemeChange}
 *  scheme={scheme}
 *  unstable_history={unstable_history}
 *  unstable_noAuthBoundary={unstable_noAuthBoundary}
 * >
 *   <StudioLayout />
 *</StudioProvider>
 * ```
 */
export function StudioLayout() {
  // Use the layout component that is resolved by the Components API (`studio.components.layout`).
  // The default component is the `StudioLayoutComponent` defined below.
  const Layout = useLayoutComponent()

  return <Layout />
}

/**
 * @internal
 * The default Studio Layout component
 * */
export function StudioLayoutComponent() {
  const {name, title, tools} = useWorkspace()
  const router = useRouter()
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const activeTool = useMemo(
    () => tools.find((tool) => tool.name === activeToolName),
    [activeToolName, tools],
  )
  const [searchFullscreenOpen, setSearchFullscreenOpen] = useState<boolean>(false)
  const [searchFullscreenPortalEl, setSearchFullscreenPortalEl] = useState<HTMLDivElement | null>(
    null,
  )
  const [searchOpen, setSearchOpen] = useState<boolean>(false)

  const documentTitle = useMemo(() => {
    const mainTitle = title || startCase(name)

    if (activeToolName) {
      return `${startCase(activeToolName)} | ${mainTitle}`
    }

    return mainTitle
  }, [activeToolName, name, title])
  const toolControlsDocumentTitle = !!activeTool?.controlsDocumentTitle

  useEffect(() => {
    if (toolControlsDocumentTitle) {
      return
    }
    document.title = documentTitle
  }, [documentTitle, toolControlsDocumentTitle])

  const handleSearchFullscreenOpenChange = useCallback((open: boolean) => {
    setSearchFullscreenOpen(open)
  }, [])

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open)
  }, [])

  const navbarContextValue = useMemo(
    () => ({
      searchFullscreenOpen,
      searchFullscreenPortalEl,
      searchOpen,
      onSearchFullscreenOpenChange: handleSearchFullscreenOpenChange,
      onSearchOpenChange: handleSearchOpenChange,
    }),
    [
      searchFullscreenOpen,
      searchFullscreenPortalEl,
      searchOpen,
      handleSearchFullscreenOpenChange,
      handleSearchOpenChange,
    ],
  )

  const Navbar = useNavbarComponent()

  /**
   * Handle legacy URL redirects from `/desk` to `/structure`
   */
  const isLegacyDeskRedirect =
    !activeTool &&
    (activeToolName === 'desk' || !activeToolName) &&
    typeof window !== 'undefined' &&
    /\/desk(\/|$)/.test(window.location.pathname) &&
    tools.some((tool) => tool.name === 'structure')

  useEffect(() => {
    if (!isLegacyDeskRedirect) {
      return
    }

    router.navigateUrl({
      path: window.location.pathname.replace(/\/desk/, '/structure'),
      replace: true,
    })
  }, [isLegacyDeskRedirect, router])

  return (
    <Flex data-ui="ToolScreen" direction="column" height="fill" data-testid="studio-layout">
      <NavbarContext.Provider value={navbarContextValue}>
        <Navbar />
      </NavbarContext.Provider>
      {isLegacyDeskRedirect && <RedirectingScreen />}
      {tools.length === 0 && <NoToolsScreen />}
      {tools.length > 0 && !activeTool && activeToolName && !isLegacyDeskRedirect && (
        <ToolNotFoundScreen toolName={activeToolName} />
      )}
      {searchFullscreenOpen && (
        <SearchFullscreenPortalCard ref={setSearchFullscreenPortalEl} overflow="auto" />
      )}
      {/* By using the tool name as the key on the error boundary, we force it to re-render
          when switching tools, which ensures we don't show the wrong tool having crashed */}
      <StudioErrorBoundary key={activeTool?.name} heading={`The ${activeTool?.name} tool crashed`}>
        <Card flex={1} hidden={searchFullscreenOpen}>
          {activeTool && activeToolName && (
            <RouteScope
              scope={activeToolName}
              __unsafe_disableScopedSearchParams={
                activeTool.router?.__unsafe_disableScopedSearchParams
              }
            >
              <Suspense fallback={<LoadingBlock showText />}>
                {createElement(activeTool.component, {tool: activeTool})}
              </Suspense>
            </RouteScope>
          )}
        </Card>
      </StudioErrorBoundary>
    </Flex>
  )
}

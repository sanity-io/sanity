/* oxlint-disable @sanity/i18n/no-attribute-template-literals */
import {useTelemetry} from '@sanity/telemetry/react'
import {Card} from '@sanity/ui'
import startCase from 'lodash-es/startCase.js'
import {
  Activity,
  type ComponentType,
  lazy,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {MountedToolsContext, NavbarContext, RouterContext} from 'sanity/_singletons'
import {RouteScope, useRouter, useRouterState} from 'sanity/router'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {isDefaultRouteTool} from '../config/isDefaultRouteTool'
import {type ActiveToolLayoutProps} from '../config/studio/types'
import {type Tool} from '../config/types'
import {DocumentLimitsUpsellPanel} from '../limits/context/documents/DocumentLimitsUpsellPanel'
import {isDocumentLimitError} from '../limits/context/documents/isDocumentLimitError'
import {StudioReadyMeasured} from './__telemetry__/bootstrap.telemetry'
import {useMountedTools} from './mountedTools/useMountedTools'
import {useNetworkProtocolCheck} from './networkCheck/useNetworkProtocolCheck'
import {NoToolsScreen} from './screens/NoToolsScreen'
import {RedirectingScreen} from './screens/RedirectingScreen'
import {ToolNotFoundScreen} from './screens/ToolNotFoundScreen'
import {useActiveToolLayoutComponent} from './studio-components-hooks/useActiveToolLayoutComponent'
import {useNavbarComponent} from './studio-components-hooks/useNavbarComponent'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {getPageVisibilitySnapshot} from './telemetry/pageVisibility'
import {ToolMountTimer} from './ToolMountTimer'
import {UnclaimedProjectNudge} from './unclaimedProject/UnclaimedProjectNudge'
import {useWorkspace} from './workspace'

const DetectViteDevServerStopped = lazy(() =>
  import('./ViteDevServerStopped').then((DevServerStopped) => ({
    default: DevServerStopped.DetectViteDevServerStopped,
  })),
)

const detectViteDevServerStopped = import.meta.hot && process.env.NODE_ENV === 'development'

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

// Module-level one-shot guard so the event fires once per page load, not
// per-mount (StrictMode double-mounts in dev; re-mounting Studio shouldn't
// refire either).
let studioReadyFired = false

interface RenderToolProps {
  tool: Tool
  /** The `studio.components.activeToolLayout` middleware chain, from `useActiveToolLayoutComponent()` */
  ActiveToolLayout: ComponentType<Omit<ActiveToolLayoutProps, 'renderDefault'>>
  /** Set when the active tool changes; `ToolMountTimer` measures from it once the tool has committed */
  toolMountT0Ref: RefObject<number | null>
}

/**
 * A tool's screen: its route scope, its Suspense boundary and the mount timer, so the two ways
 * `StudioLayoutComponent` renders tools (only the active one, or every mounted one inside an
 * `<Activity>` boundary) share one definition.
 */
function RenderTool({tool, ActiveToolLayout, toolMountT0Ref}: RenderToolProps) {
  return (
    <RouteScope
      scope={tool.name}
      __unsafe_disableScopedSearchParams={tool.router?.__unsafe_disableScopedSearchParams}
    >
      <Suspense fallback={<LoadingBlock showText />}>
        <ActiveToolLayout activeTool={tool} />
        <ToolMountTimer toolName={tool.name} t0Ref={toolMountT0Ref} />
      </Suspense>
    </RouteScope>
  )
}

/**
 * @internal
 * The default Studio Layout component
 * */
export function StudioLayoutComponent() {
  const {beta, name, title, tools} = useWorkspace()
  const telemetry = useTelemetry()

  // In the background, check if the network protocol used to communicate with the
  // Sanity API is modern (HTTP/2 or newer). Shows a toast if it's not.
  useNetworkProtocolCheck()

  const defaultRouteTools = useMemo(() => tools.filter(isDefaultRouteTool), [tools])

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
  // With `beta.reactActivityMode`, the tools used most recently stay mounted inside a
  // hidden `<Activity>` boundary instead of being unmounted when another tool takes over.
  const reactActivityMode = beta?.reactActivityMode?.enabled === true
  const {mountedTools, contextValue: mountedToolsContextValue} = useMountedTools({
    enabled: reactActivityMode,
    tools,
    activeTool,
  })
  // Track T0 for tool-mount timing. Because React Compiler forbids impure
  // calls like `performance.now()` during render, we capture the timestamp
  // in an effect that runs when `activeToolName` changes. A layout effect,
  // because `ToolMountTimer` reads the ref from a passive effect: React runs
  // every layout effect of a commit before any passive effect, so the
  // timestamp is in place even when the tool commits in the same pass as the
  // switch (an already loaded chunk, or a hidden `<Activity>` boundary being
  // shown again). A passive effect here would run after the child's, since
  // passive effects run child first. When the tool's lazy chunk still has to
  // load, the Suspense fallback commits first and the delta still includes
  // the fetch time.
  const toolMountT0Ref = useRef<number | null>(null)
  const lastToolNameRef = useRef<string | undefined>(undefined)
  useLayoutEffect(() => {
    if (activeToolName !== lastToolNameRef.current) {
      lastToolNameRef.current = activeToolName
      toolMountT0Ref.current = activeToolName ? performance.now() : null
    }
  }, [activeToolName])
  const [searchFullscreenOpen, setSearchFullscreenOpen] = useState<boolean>(false)
  const [searchFullscreenPortalEl, setSearchFullscreenPortalEl] = useState<HTMLDivElement | null>(
    null,
  )
  const [searchOpen, setSearchOpen] = useState<boolean>(false)

  const documentTitle = useMemo(() => {
    const workspaceTitle = title || startCase(name)
    const toolTitle = activeTool ? activeTool.title || activeTool.name : undefined
    if (toolTitle) {
      return `${toolTitle} | ${workspaceTitle}`
    }
    return workspaceTitle
  }, [activeTool, name, title])

  const toolControlsDocumentTitle = !!activeTool?.controlsDocumentTitle

  useEffect(() => {
    if (toolControlsDocumentTitle) {
      return
    }
    document.title = documentTitle
  }, [documentTitle, toolControlsDocumentTitle])

  // Fire a one-shot "Studio Ready" telemetry event the first time the
  // active tool resolves. Gives us a user-perceived "Studio is interactive"
  // timing, from browser navigation start to first tool render.
  useEffect(() => {
    if (studioReadyFired) return
    if (!activeTool) return
    studioReadyFired = true
    const durationMs = performance.now()
    telemetry.log(StudioReadyMeasured, {
      durationMs,
      toolsCount: tools.length,
      activeToolName: activeTool.name,
      ...getPageVisibilitySnapshot(durationMs),
    })
  }, [activeTool, telemetry, tools.length])

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
  const ActiveToolLayout = useActiveToolLayoutComponent()

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

  const getErrorScreen = useCallback((error: Error) => {
    if (isDocumentLimitError(error)) {
      return <DocumentLimitsUpsellPanel />
    }
    return null
  }, [])

  return (
    <MountedToolsContext.Provider value={mountedToolsContextValue}>
      <Flex data-ui="ToolScreen" flexDirection="column" height="100%" data-testid="studio-layout">
        <NavbarContext.Provider value={navbarContextValue}>
          {/* No boundary here on purpose: the navbar's height depends on what it renders (the
              perspective bar with variants enabled, for one), so a lazy navbar suspends up to
              StudioLayout's loading screen rather than reserving a row of the wrong height. */}
          {/* oxlint-disable-next-line react/static-components -- Navbar comes from useNavbarComponent(), stable per workspace */}
          <Navbar />
        </NavbarContext.Provider>
        <UnclaimedProjectNudge />
        {isLegacyDeskRedirect && <RedirectingScreen />}
        {!activeTool && defaultRouteTools.length === 0 && <NoToolsScreen />}
        {tools.length > 0 && !activeTool && activeToolName && !isLegacyDeskRedirect && (
          <ToolNotFoundScreen toolName={activeToolName} />
        )}
        {searchFullscreenOpen && (
          <SearchFullscreenPortalCard ref={setSearchFullscreenPortalEl} overflow="auto" />
        )}
        {reactActivityMode ? (
          <StudioErrorBoundary>
            {detectViteDevServerStopped && <DetectViteDevServerStopped />}
            <Card flex={1} hidden={searchFullscreenOpen}>
              {mountedTools.map(({tool, router: toolRouter}) => (
                // Each tool keeps the root router context it last rendered with while active, so
                // a hidden tool holds on to its own URL state instead of picking up the active
                // tool's. `useMountedTools` keeps the active tool's entry on the live router.
                <Activity
                  key={tool.name}
                  mode={tool.name === activeToolName ? 'visible' : 'hidden'}
                >
                  <RouterContext.Provider value={toolRouter}>
                    <StudioErrorBoundary
                      heading={`The ${tool.name} tool crashed`}
                      getErrorScreen={getErrorScreen}
                    >
                      <RenderTool
                        tool={tool}
                        ActiveToolLayout={ActiveToolLayout}
                        toolMountT0Ref={toolMountT0Ref}
                      />
                    </StudioErrorBoundary>
                  </RouterContext.Provider>
                </Activity>
              ))}
            </Card>
          </StudioErrorBoundary>
        ) : (
          // By using the tool name as the key on the error boundary, we force it to re-render
          // when switching tools, which ensures we don't show the wrong tool having crashed
          <StudioErrorBoundary
            key={activeTool?.name}
            heading={`The ${activeTool?.name} tool crashed`}
            getErrorScreen={getErrorScreen}
          >
            {detectViteDevServerStopped && <DetectViteDevServerStopped />}
            <Card flex={1} hidden={searchFullscreenOpen}>
              {activeTool && (
                <RenderTool
                  tool={activeTool}
                  ActiveToolLayout={ActiveToolLayout}
                  toolMountT0Ref={toolMountT0Ref}
                />
              )}
            </Card>
          </StudioErrorBoundary>
        )}
      </Flex>
    </MountedToolsContext.Provider>
  )
}

/* eslint-disable max-statements,@typescript-eslint/no-shadow */
import {studioPath} from '@sanity/client/csm'
import {
  type Controller,
  createConnectionMachine,
  createController,
  type Message,
} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type PreviewKitNodeMsg,
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {
  urlSearchParamVercelProtectionBypass,
  urlSearchParamVercelSetBypassCookie,
} from '@sanity/preview-url-secret/constants'
import {BoundaryElementProvider, Flex} from '@sanity/ui'
import {lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {
  type CommentIntentGetter,
  COMMENTS_INSPECTOR_NAME,
  type Path,
  type SanityDocument,
  type Tool,
  useDataset,
  usePerspective,
  useProjectId,
  useUnique,
  useWorkspace,
} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {styled} from 'styled-components'
import {useEffectEvent} from 'use-effect-event'

import {DEFAULT_TOOL_NAME, EDIT_INTENT_MODE} from './constants'
import PostMessageFeatures from './features/PostMessageFeatures'
import {debounce} from './lib/debounce'
import {SharedStateProvider} from './overlays/SharedStateProvider'
import {Panel} from './panels/Panel'
import {Panels} from './panels/Panels'
import {PresentationContent} from './PresentationContent'
import {PresentationNavigateProvider} from './PresentationNavigateProvider'
import {usePresentationNavigator} from './PresentationNavigator'
import {PresentationParamsProvider} from './PresentationParamsProvider'
import {PresentationProvider} from './PresentationProvider'
import {Preview} from './preview/Preview'
import {
  ACTION_IFRAME_LOADED,
  ACTION_IFRAME_REFRESH,
  ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE,
  presentationReducer,
  presentationReducerInit,
} from './reducers/presentationReducer'
import {
  type FrameState,
  type PresentationNavigate,
  type PresentationPerspective,
  type PresentationPluginOptions,
  type PresentationStateParams,
  type PresentationViewport,
  type StructureDocumentPaneParams,
  type VisualEditingConnection,
} from './types'
import {useDocumentsOnPage} from './useDocumentsOnPage'
import {useMainDocument} from './useMainDocument'
import {useParams} from './useParams'
import {usePopups} from './usePopups'
import {usePreviewUrl} from './usePreviewUrl'
import {useStatus} from './useStatus'

const LiveQueries = lazy(() => import('./loader/LiveQueries'))
const PostMessageDocuments = lazy(() => import('./overlays/PostMessageDocuments'))
const PostMessageRefreshMutations = lazy(() => import('./editor/PostMessageRefreshMutations'))
const PostMessagePerspective = lazy(() => import('./PostMessagePerspective'))
const PostMessagePreviewSnapshots = lazy(() => import('./editor/PostMessagePreviewSnapshots'))
const PostMessageSchema = lazy(() => import('./overlays/schema/PostMessageSchema'))
const PostMessageTelemetry = lazy(() => import('./PostMessageTelemetry'))

const Container = styled(Flex)`
  overflow-x: auto;
`

export default function PresentationTool(props: {
  tool: Tool<PresentationPluginOptions>
  canCreateUrlPreviewSecrets: boolean
  canToggleSharePreviewAccess: boolean
  canUseSharedPreviewAccess: boolean
  vercelProtectionBypass: string | null
}): React.JSX.Element {
  const {
    canCreateUrlPreviewSecrets,
    canToggleSharePreviewAccess,
    canUseSharedPreviewAccess,
    tool,
    vercelProtectionBypass,
  } = props
  const components = tool.options?.components
  const _previewUrl = tool.options?.previewUrl
  const name = tool.name || DEFAULT_TOOL_NAME
  const {unstable_navigator, unstable_header} = components || {}

  const {navigate: routerNavigate, state: routerState} = useRouter() as RouterContextValue & {
    state: PresentationStateParams
  }
  const routerSearchParams = useUnique(Object.fromEntries(routerState._searchParams || []))
  const {perspectiveStack, selectedPerspectiveName = 'drafts', selectedReleaseId} = usePerspective()
  const perspective = (
    selectedReleaseId ? perspectiveStack : selectedPerspectiveName
  ) as PresentationPerspective

  const initialPreviewUrl = usePreviewUrl(
    _previewUrl || '/',
    name,
    perspective,
    routerSearchParams.preview || null,
    canCreateUrlPreviewSecrets,
  )
  const canSharePreviewAccess = useMemo<boolean>(() => {
    if (
      _previewUrl &&
      typeof _previewUrl === 'object' &&
      'draftMode' in _previewUrl &&
      _previewUrl.draftMode
    ) {
      // eslint-disable-next-line no-console
      console.warn('previewUrl.draftMode is deprecated, use previewUrl.previewMode instead')
      return _previewUrl.draftMode.shareAccess !== false
    }
    if (
      _previewUrl &&
      typeof _previewUrl === 'object' &&
      'previewMode' in _previewUrl &&
      _previewUrl.previewMode
    ) {
      return _previewUrl.previewMode.shareAccess !== false
    }
    return false
  }, [_previewUrl])

  const [devMode] = useState(() => {
    const option = tool.options?.devMode

    if (typeof option === 'function') return option()
    if (typeof option === 'boolean') return option

    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
  })

  const targetOrigin = useMemo(() => {
    return initialPreviewUrl.origin
  }, [initialPreviewUrl.origin])

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [controller, setController] = useState<Controller>()
  const [visualEditingComlink, setVisualEditingComlink] = useState<VisualEditingConnection | null>(
    null,
  )

  const frameStateRef = useRef<FrameState>({
    title: undefined,
    url: undefined,
  })

  const {
    navigate: _navigate,
    navigationHistory,
    params,
    searchParams,
    structureParams,
  } = useParams({
    initialPreviewUrl,
    routerNavigate,
    routerState,
    routerSearchParams,
    frameStateRef,
  })

  // Most navigation events should be debounced, so use this unless explicitly needed
  const navigate = useMemo(() => debounce<PresentationNavigate>(_navigate, 50), [_navigate])

  const [state, dispatch] = useReducer(presentationReducer, {}, presentationReducerInit)

  const viewport = useMemo(() => (params.viewport ? 'mobile' : 'desktop'), [params.viewport])

  const [documentsOnPage, setDocumentsOnPage] = useDocumentsOnPage(perspective, frameStateRef)

  const projectId = useProjectId()
  const dataset = useDataset()

  const mainDocumentState = useMainDocument({
    // Prevent flash of content by using immediate navigation
    navigate: _navigate,
    navigationHistory,
    path: params.preview,
    previewUrl: tool.options?.previewUrl,
    resolvers: tool.options?.resolve?.mainDocuments,
  })

  const [overlaysConnection, setOverlaysConnection] = useStatus()
  const [loadersConnection, setLoadersConnection] = useStatus()
  const [previewKitConnection, setPreviewKitConnection] = useStatus()

  const {open: handleOpenPopup} = usePopups(controller)

  const isLoading = state.iframe.status === 'loading'

  useEffect(() => {
    const target = iframeRef.current?.contentWindow

    if (!target || isLoading) return undefined

    const controller = createController({targetOrigin})
    controller.addTarget(target)
    setController(controller)

    return () => {
      controller.destroy()
      setController(undefined)
    }
  }, [targetOrigin, isLoading])

  const handleNavigate = useEffectEvent<typeof navigate>(
    (nextState, nextSearchState, forceReplace) =>
      navigate(nextState, nextSearchState, forceReplace),
  )
  useEffect(() => {
    if (!controller) return undefined

    const comlink = controller.createChannel<VisualEditingControllerMsg, VisualEditingNodeMsg>(
      {
        name: 'presentation',
        heartbeat: true,
        connectTo: 'visual-editing',
      },
      createConnectionMachine<VisualEditingControllerMsg, VisualEditingNodeMsg>().provide({
        actors: createCompatibilityActors<VisualEditingControllerMsg>(),
      }),
    )

    comlink.on('visual-editing/focus', (data) => {
      if (!('id' in data)) return
      handleNavigate({
        type: data.type,
        id: data.id,
        path: data.path,
      })
    })

    comlink.on('visual-editing/navigate', (data) => {
      const {title, url} = data
      if (frameStateRef.current.url !== url) {
        try {
          // Handle bypass params being forwarded to the final URL
          const [urlWithoutSearch, search] = url.split('?')
          const searchParams = new URLSearchParams(search)
          searchParams.delete(urlSearchParamVercelProtectionBypass)
          searchParams.delete(urlSearchParamVercelSetBypassCookie)
          handleNavigate(
            {},
            {preview: `${urlWithoutSearch}${searchParams.size > 0 ? '?' : ''}${searchParams}`},
          )
        } catch {
          handleNavigate({}, {preview: url})
        }
      }
      frameStateRef.current = {title, url}
    })

    comlink.on('visual-editing/meta', (data) => {
      frameStateRef.current.title = data.title
    })

    comlink.on('visual-editing/toggle', (data) => {
      dispatch({
        type: ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE,
        enabled: data.enabled,
      })
    })

    comlink.on('visual-editing/documents', (data) => {
      setDocumentsOnPage(
        'visual-editing',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.perspective as unknown as any,
        data.documents,
      )
    })

    // @todo This won't work for multiple window contexts?
    comlink.on('visual-editing/refreshing', (data) => {
      if (data.source === 'manual') {
        clearTimeout(refreshRef.current)
      } else if (data.source === 'mutation') {
        dispatch({type: ACTION_IFRAME_REFRESH})
      }
    })

    comlink.on('visual-editing/refreshed', () => {
      dispatch({type: ACTION_IFRAME_LOADED})
    })

    comlink.onStatus(setOverlaysConnection)

    const stop = comlink.start()
    setVisualEditingComlink(comlink)
    return () => {
      stop()
      setVisualEditingComlink(null)
    }
  }, [controller, setDocumentsOnPage, setOverlaysConnection, targetOrigin])

  useEffect(() => {
    if (!controller) return undefined
    const comlink = controller.createChannel<Message, PreviewKitNodeMsg>(
      {
        name: 'presentation',
        connectTo: 'preview-kit',
        heartbeat: true,
      },
      createConnectionMachine<Message, PreviewKitNodeMsg>().provide({
        actors: createCompatibilityActors(),
      }),
    )

    comlink.onStatus(setPreviewKitConnection)

    comlink.on('preview-kit/documents', (data) => {
      if (data.projectId === projectId && data.dataset === dataset) {
        setDocumentsOnPage(
          'preview-kit',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.perspective as unknown as any,
          data.documents,
        )
      }
    })

    return comlink.start()
  }, [controller, dataset, projectId, setDocumentsOnPage, setPreviewKitConnection, targetOrigin])

  const handleFocusPath = useCallback(
    (nextPath: Path) => {
      // Don’t need to explicitly set the id here because it was either already set via postMessage or is the same if navigating in the document pane
      navigate({path: studioPath.toString(nextPath)}, {}, true)
    },
    [navigate],
  )

  const handlePreviewPath = useCallback(
    (nextPath: string) => {
      const url = new URL(nextPath, initialPreviewUrl.origin)
      const preview = url.pathname + url.search
      if (url.origin === initialPreviewUrl.origin && preview !== params.preview) {
        navigate({}, {preview})
      }
    },
    [initialPreviewUrl, params, navigate],
  )

  const handleStructureParams = useCallback(
    (structureParams: StructureDocumentPaneParams) => {
      navigate({}, structureParams)
    },
    [navigate],
  )

  // Dispatch a focus or blur message when the id or path change
  useEffect(() => {
    if (params.id && params.path) {
      visualEditingComlink?.post('presentation/focus', {id: params.id, path: params.path})
    } else {
      visualEditingComlink?.post('presentation/blur')
    }
  }, [params.id, params.path, visualEditingComlink])

  // Dispatch a navigation message when the preview param changes
  useEffect(() => {
    if (
      frameStateRef.current.url &&
      params.preview &&
      frameStateRef.current.url !== params.preview
    ) {
      frameStateRef.current.url = params.preview
      if (overlaysConnection !== 'connected' && iframeRef.current) {
        iframeRef.current.src = `${targetOrigin}${params.preview}`
      } else {
        visualEditingComlink?.post('presentation/navigate', {
          url: params.preview,
          type: 'replace',
        })
      }
    }
  }, [overlaysConnection, targetOrigin, params.preview, visualEditingComlink])

  const toggleOverlay = useCallback(
    () => visualEditingComlink?.post('presentation/toggle-overlay'),
    [visualEditingComlink],
  )

  const [displayedDocument, setDisplayedDocument] = useState<
    Partial<SanityDocument> | null | undefined
  >(null)

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isAltKey(e)) {
        toggleOverlay()
      }
    }
    const handleKeydown = (e: KeyboardEvent) => {
      if (isAltKey(e)) {
        toggleOverlay()
      }

      if (isHotkey(['mod', '\\'], e)) {
        toggleOverlay()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [toggleOverlay])

  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  const [{navigatorEnabled, toggleNavigator}, PresentationNavigator] = usePresentationNavigator({
    unstable_navigator,
  })

  const refreshRef = useRef<number>(undefined)
  const handleRefresh = useCallback(
    (fallback: () => void) => {
      dispatch({type: ACTION_IFRAME_REFRESH})
      if (visualEditingComlink) {
        // We only wait 300ms for the iframe to ack the refresh request before running the fallback logic
        refreshRef.current = window.setTimeout(fallback, 300)
        visualEditingComlink.post('presentation/refresh', {
          source: 'manual',
          livePreviewEnabled:
            previewKitConnection === 'connected' || loadersConnection === 'connected',
        })
        return
      }
      fallback()
    },
    [loadersConnection, previewKitConnection, visualEditingComlink],
  )

  const workspace = useWorkspace()

  const getCommentIntent = useCallback<CommentIntentGetter>(
    ({id, type, path}) => {
      if (frameStateRef.current.url) {
        return {
          title: frameStateRef.current.title || frameStateRef.current.url,
          name: 'edit',
          params: {
            id,
            path,
            type,
            inspect: COMMENTS_INSPECTOR_NAME,
            workspace: workspace.name,
            mode: EDIT_INTENT_MODE,
            preview: params.preview,
          },
        }
      }
      return undefined
    },
    [params.preview, workspace.name],
  )

  const setViewport = useCallback(
    (next: PresentationViewport) => {
      // Omit the viewport URL search param if the next viewport state is the
      // default: 'desktop'
      const viewport = next === 'desktop' ? undefined : 'mobile'
      navigate({}, {viewport}, true)
    },
    [navigate],
  )

  return (
    <>
      <PresentationProvider
        devMode={devMode}
        name={name}
        navigate={navigate}
        params={params}
        searchParams={searchParams}
        structureParams={structureParams}
      >
        <PresentationNavigateProvider navigate={navigate}>
          <PresentationParamsProvider params={params}>
            <SharedStateProvider comlink={visualEditingComlink}>
              <Container data-testid="presentation-root" height="fill">
                <Panels>
                  <PresentationNavigator />
                  <Panel
                    id="preview"
                    minWidth={325}
                    defaultSize={navigatorEnabled ? 50 : 75}
                    order={3}
                  >
                    <Flex direction="column" flex={1} height="fill" ref={setBoundaryElement}>
                      <BoundaryElementProvider element={boundaryElement}>
                        <Preview
                          // Make sure the iframe is unmounted if the targetOrigin has changed
                          key={targetOrigin}
                          canSharePreviewAccess={canSharePreviewAccess}
                          canToggleSharePreviewAccess={canToggleSharePreviewAccess}
                          canUseSharedPreviewAccess={canUseSharedPreviewAccess}
                          dispatch={dispatch}
                          header={unstable_header}
                          iframe={state.iframe}
                          initialUrl={initialPreviewUrl}
                          loadersConnection={loadersConnection}
                          navigatorEnabled={navigatorEnabled}
                          onPathChange={handlePreviewPath}
                          onRefresh={handleRefresh}
                          openPopup={handleOpenPopup}
                          overlaysConnection={overlaysConnection}
                          previewUrl={params.preview}
                          perspective={perspective}
                          ref={iframeRef}
                          setViewport={setViewport}
                          targetOrigin={targetOrigin}
                          toggleNavigator={toggleNavigator}
                          toggleOverlay={toggleOverlay}
                          viewport={viewport}
                          visualEditing={state.visualEditing}
                          vercelProtectionBypass={vercelProtectionBypass}
                        />
                      </BoundaryElementProvider>
                    </Flex>
                  </Panel>
                  <PresentationContent
                    documentId={params.id}
                    documentsOnPage={documentsOnPage}
                    documentType={params.type}
                    getCommentIntent={getCommentIntent}
                    mainDocumentState={mainDocumentState}
                    onFocusPath={handleFocusPath}
                    onStructureParams={handleStructureParams}
                    searchParams={searchParams}
                    setDisplayedDocument={setDisplayedDocument}
                    structureParams={structureParams}
                  />
                </Panels>
              </Container>
            </SharedStateProvider>
          </PresentationParamsProvider>
        </PresentationNavigateProvider>
      </PresentationProvider>
      <Suspense>
        {controller && (
          <LiveQueries
            controller={controller}
            perspective={perspective}
            liveDocument={displayedDocument}
            onDocumentsOnPage={setDocumentsOnPage}
            onLoadersConnection={setLoadersConnection}
          />
        )}
        {visualEditingComlink && params.id && params.type && (
          <PostMessageRefreshMutations
            comlink={visualEditingComlink}
            id={params.id}
            type={params.type}
            loadersConnection={loadersConnection}
            previewKitConnection={previewKitConnection}
          />
        )}
        {visualEditingComlink && (
          <PostMessageSchema comlink={visualEditingComlink} perspective={perspective} />
        )}
        {visualEditingComlink && documentsOnPage.length > 0 && (
          <PostMessagePreviewSnapshots
            comlink={visualEditingComlink}
            perspective={perspective}
            refs={documentsOnPage}
          />
        )}
        {visualEditingComlink && (
          <PostMessageDocuments comlink={visualEditingComlink} perspective={perspective} />
        )}
        {visualEditingComlink && <PostMessageFeatures comlink={visualEditingComlink} />}
        {visualEditingComlink && (
          <PostMessagePerspective comlink={visualEditingComlink} perspective={perspective} />
        )}
        {visualEditingComlink && <PostMessageTelemetry comlink={visualEditingComlink} />}
      </Suspense>
    </>
  )
}

function isAltKey(event: KeyboardEvent): boolean {
  return event.key === 'Alt'
}

const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
const MODIFIERS: Record<string, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'> = {
  alt: 'altKey',
  ctrl: 'ctrlKey',
  mod: IS_MAC ? 'metaKey' : 'ctrlKey',
  shift: 'shiftKey',
}
function isHotkey(keys: string[], event: KeyboardEvent): boolean {
  return keys.every((key) => {
    if (MODIFIERS[key]) {
      return event[MODIFIERS[key]]
    }
    return event.key === key.toUpperCase()
  })
}

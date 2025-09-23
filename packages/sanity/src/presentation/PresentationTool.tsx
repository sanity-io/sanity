/* eslint-disable @typescript-eslint/no-shadow */
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
import {useActorRef, useSelector} from '@xstate/react'
import {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type CommentIntentGetter,
  COMMENTS_INSPECTOR_NAME,
  type SanityDocument,
  type Tool,
  useDataset,
  useProjectId,
  useUnique,
  useWorkspace,
} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {styled} from 'styled-components'
import {useEffectEvent} from 'use-effect-event'

import {DEFAULT_TOOL_NAME, EDIT_INTENT_MODE} from './constants'
import {DecideParametersProvider} from './DecideParametersProvider'
import PostMessageFeatures from './features/PostMessageFeatures'
import {presentationMachine} from './machines/presentation-machine'
import {type PreviewUrlRef} from './machines/preview-url'
import {MainDocumentStateProvider} from './MainDocumentStateProvider'
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
  type FrameState,
  type MainDocumentState,
  type PresentationNavigate,
  type PresentationPluginOptions,
  type PresentationStateParams,
  type PresentationViewport,
  type StructureDocumentPaneParams,
  type VisualEditingConnection,
} from './types'
import {useAllowPatterns} from './useAllowPatterns'
import {useDocumentsOnPage} from './useDocumentsOnPage'
import {useParams} from './useParams'
import {usePopups} from './usePopups'
import {usePresentationPerspective} from './usePresentationPerspective'
import {useStatus} from './useStatus'
import {useTargetOrigin} from './useTargetOrigin'
import {debounce} from './util/debounce'

const LiveQueries = lazy(() => import('./loader/LiveQueries'))
const PostMessageDocuments = lazy(() => import('./overlays/PostMessageDocuments'))
const PostMessageRefreshMutations = lazy(() => import('./editor/PostMessageRefreshMutations'))
const PostMessageDecideParameters = lazy(() => import('./PostMessageDecideParameters'))
const PostMessagePerspective = lazy(() => import('./PostMessagePerspective'))
const PostMessagePreviewSnapshots = lazy(() => import('./editor/PostMessagePreviewSnapshots'))
const PostMessageSchema = lazy(() => import('./overlays/schema/PostMessageSchema'))
const PostMessageTelemetry = lazy(() => import('./PostMessageTelemetry'))

const Container = styled(Flex)`
  overflow-x: auto;
`

export default function PresentationTool(props: {
  tool: Tool<PresentationPluginOptions>
  canToggleSharePreviewAccess: boolean
  canUseSharedPreviewAccess: boolean
  vercelProtectionBypass: string | null
  initialPreviewUrl: URL
  previewUrlRef: PreviewUrlRef
}): React.JSX.Element {
  const {
    canToggleSharePreviewAccess,
    canUseSharedPreviewAccess,
    tool,
    vercelProtectionBypass,
    initialPreviewUrl,
    previewUrlRef,
  } = props

  const allowOrigins = useAllowPatterns(previewUrlRef)
  const targetOrigin = useTargetOrigin(previewUrlRef)

  const components = tool.options?.components
  const name = tool.name || DEFAULT_TOOL_NAME
  const {unstable_navigator, unstable_header} = components || {}

  const {navigate: routerNavigate, state: routerState} = useRouter() as RouterContextValue & {
    state: PresentationStateParams
  }
  const routerSearchParams = useUnique(Object.fromEntries(routerState._searchParams || []))
  const perspective = usePresentationPerspective()

  const canSharePreviewAccess = useSelector(
    previewUrlRef,
    (state) => state.context.previewMode?.shareAccess !== false,
  )

  const [devMode] = useState(() => {
    const option = tool.options?.devMode

    if (typeof option === 'function') return option()
    if (typeof option === 'boolean') return option

    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
  })

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [controller, setController] = useState<Controller>()
  const [visualEditingComlink, setVisualEditingComlink] = useState<VisualEditingConnection | null>(
    null,
  )

  const frameStateRef = useRef<FrameState>({
    title: undefined,
    url: undefined,
  })

  const {isSameDocument, navigate, navigationHistory, params, searchParams, structureParams} =
    useParams({
      initialPreviewUrl,
      routerNavigate,
      routerState,
      routerSearchParams,
      frameStateRef,
    })

  const presentationRef = useActorRef(presentationMachine)

  const viewport = useMemo(() => (params.viewport ? 'mobile' : 'desktop'), [params.viewport])

  const [documentsOnPage, setDocumentsOnPage] = useDocumentsOnPage(perspective, frameStateRef)

  const projectId = useProjectId()
  const dataset = useDataset()

  const [mainDocumentState, setMainDocumentState] = useState<MainDocumentState | undefined>(
    undefined,
  )

  const [overlaysConnection, setOverlaysConnection] = useStatus()
  const [loadersConnection, setLoadersConnection] = useStatus()
  const [previewKitConnection, setPreviewKitConnection] = useStatus()

  const {open: handleOpenPopup} = usePopups(controller)

  const isLoading = useSelector(presentationRef, (state) => state.matches('loading'))

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

  const handleNavigate = useEffectEvent<PresentationNavigate>((options) => {
    navigate(options)
  })

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
        state: {
          type: data.type,
          id: data.id,
          path: data.path,
        },
      })
    })

    comlink.on('visual-editing/navigate', (data) => {
      const {title} = data
      let url = data.url
      /**
       * The URL is relative, we need to resolve it to an absolute URL
       */
      if (!url.startsWith('http')) {
        try {
          url = new URL(url, targetOrigin).toString()
        } catch {
          // ignore
        }
      }

      if (frameStateRef.current.url !== url) {
        try {
          // Handle bypass params being forwarded to the final URL
          const [urlWithoutSearch, search] = url.split('?')
          const searchParams = new URLSearchParams(search)
          searchParams.delete(urlSearchParamVercelProtectionBypass)
          searchParams.delete(urlSearchParamVercelSetBypassCookie)
          handleNavigate({
            params: {
              preview: `${urlWithoutSearch}${searchParams.size > 0 ? '?' : ''}${searchParams}`,
            },
          })
        } catch {
          handleNavigate({params: {preview: url}})
        }
      }
      frameStateRef.current = {title, url}
    })

    comlink.on('visual-editing/meta', (data) => {
      frameStateRef.current.title = data.title
    })

    comlink.on('visual-editing/toggle', (data) => {
      presentationRef.send({type: 'toggle visual editing overlays', enabled: data.enabled})
    })

    comlink.on('visual-editing/documents', (data) => {
      setDocumentsOnPage(
        'visual-editing',
        // oxlint-disable-next-line no-explicit-any
        data.perspective as unknown as any,
        data.documents,
      )
    })

    // @todo This won't work for multiple window contexts?
    comlink.on('visual-editing/refreshing', (data) => {
      if (data.source === 'manual') {
        clearTimeout(refreshRef.current)
      } else if (data.source === 'mutation') {
        presentationRef.send({type: 'iframe refresh'})
      }
    })

    comlink.on('visual-editing/refreshed', () => {
      presentationRef.send({type: 'iframe loaded'})
    })

    comlink.onStatus(setOverlaysConnection)

    const stop = comlink.start()
    setVisualEditingComlink(comlink)
    return () => {
      stop()
      setVisualEditingComlink(null)
    }
  }, [controller, presentationRef, setDocumentsOnPage, setOverlaysConnection, targetOrigin])

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
          // oxlint-disable-next-line no-explicit-any
          data.perspective as unknown as any,
          data.documents,
        )
      }
    })

    return comlink.start()
  }, [controller, dataset, projectId, setDocumentsOnPage, setPreviewKitConnection, targetOrigin])

  const handleFocusPath = useMemo(
    () =>
      // When moving from one field to another, blur and focus events will trigger
      // this handler. We debounce to avoid unwanted intermediate navigations this
      // would cause.
      debounce<(state: Required<PresentationStateParams>) => void>((state) => {
        // We only ever want to update the path if we are still viewing the
        // document that was active when the focus event was triggered
        if (isSameDocument(state)) {
          navigate({
            state,
            replace: true,
          })
        }
      }, 0),
    [isSameDocument, navigate],
  )

  const handlePreviewPath = useCallback(
    (nextPath: string) => {
      const url = new URL(nextPath, targetOrigin)
      const preview = url.toString()
      if (params.preview === preview) {
        return
      }
      if (Array.isArray(allowOrigins)) {
        if (allowOrigins.some((pattern) => pattern.test(preview))) {
          navigate({params: {preview}})
        }
      } else if (url.origin === targetOrigin) {
        navigate({params: {preview}})
      }
    },
    [targetOrigin, params.preview, allowOrigins, navigate],
  )

  const handleStructureParams = useCallback(
    (params: StructureDocumentPaneParams) => {
      navigate({params})
    },
    [navigate],
  )

  const handleEditReference = useCallback<PresentationNavigate>(
    (options) => {
      navigate(options)
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
      try {
        const frameOrigin = new URL(frameStateRef.current.url, targetOrigin).origin
        const previewOrigin = new URL(params.preview, targetOrigin).origin
        if (frameOrigin !== previewOrigin) {
          return
        }
      } catch {
        // ignore
      }

      frameStateRef.current.url = params.preview
      if (overlaysConnection === 'connected') {
        /**
         * Translate the possibly absolute params url back to a relative URL
         */
        let url = params.preview
        if (url.startsWith('http')) {
          try {
            const newUrl = new URL(params.preview, targetOrigin)
            url = newUrl.pathname + newUrl.search + newUrl.hash
          } catch {
            // ignore
          }
        }
        visualEditingComlink?.post('presentation/navigate', {
          url,
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
      presentationRef.send({type: 'iframe refresh'})
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
    [loadersConnection, presentationRef, previewKitConnection, visualEditingComlink],
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
      navigate({
        params: {viewport},
        replace: true,
      })
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
        <DecideParametersProvider>
          <MainDocumentStateProvider
            navigate={navigate}
            navigationHistory={navigationHistory}
            path={params.preview}
            targetOrigin={targetOrigin}
            resolvers={tool.options?.resolve?.mainDocuments}
            onMainDocumentState={setMainDocumentState}
          />
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
                            // @TODO move closer to the <iframe> element itself to allow for more precise handling of when to reload the iframe and when to reconnect when the target origin changes
                            // Make sure the iframe is unmounted if the targetOrigin has changed
                            key={targetOrigin}
                            canSharePreviewAccess={canSharePreviewAccess}
                            canToggleSharePreviewAccess={canToggleSharePreviewAccess}
                            canUseSharedPreviewAccess={canUseSharedPreviewAccess}
                            header={unstable_header}
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
                            vercelProtectionBypass={vercelProtectionBypass}
                            presentationRef={presentationRef}
                            previewUrlRef={previewUrlRef}
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
                      onEditReference={handleEditReference}
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
        </DecideParametersProvider>
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
        {visualEditingComlink && <PostMessageDecideParameters comlink={visualEditingComlink} />}
        {visualEditingComlink && (
          <PostMessagePerspective comlink={visualEditingComlink} perspective={perspective} />
        )}
        {visualEditingComlink && <PostMessageTelemetry comlink={visualEditingComlink} />}
      </Suspense>
    </>
  )
}

// @TODO reconcile with core utils
function isAltKey(event: KeyboardEvent): boolean {
  return event.key === 'Alt'
}

// @TODO reconcile with core utils
const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
const MODIFIERS: Record<string, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'> = {
  alt: 'altKey',
  ctrl: 'ctrlKey',
  mod: IS_MAC ? 'metaKey' : 'ctrlKey',
  shift: 'shiftKey',
}
// @TODO reconcile with core utils
function isHotkey(keys: string[], event: KeyboardEvent): boolean {
  return keys.every((key) => {
    if (MODIFIERS[key]) {
      return event[MODIFIERS[key]]
    }
    return event.key === key.toUpperCase()
  })
}

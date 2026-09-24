import {SplitPane} from '@rexxars/react-split-pane'
import {Tab, TabList} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {type RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, usePerspective, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSIONS} from '../../../apiVersions'
import {type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../../../i18n'
import {isVisionPasteTarget} from '../../../util/isVisionPasteTarget'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {useElementSize} from '../../hooks/useElementSize'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type FetchReason, type VistaTab, type VistaTabOptions} from '../../store/types'
import {
  useVistaActor,
  useVistaExperience,
  useVistaSelector,
  type VistaLayout,
} from '../../store/VistaActorContext'
import {cx} from '../../util/cx'
import {formatGroq} from '../../util/formatGroq'
import {parseQueryUrl} from '../../util/parseQueryUrl'
import {matchVistaShortcut} from '../../util/shortcuts'
import {LIVE_EVENTS_API_VERSION} from '../../util/syncTags'
import {RequestPanel} from '../request/RequestPanel'
import {ResponsePanel} from '../response/ResponsePanel'
import {hiddenPane, paneFill, splitPaneContainer} from '../vista.css'
import {getQueryTabId, QUERY_TAB_PANEL_ID} from './QueryTabBar'

const MIN_PANE_SIZE = {columns: 280, stacked: 160}

type MobilePane = 'request' | 'response'

interface QueryTabProps {
  tab: VistaTab
  rootRef: RefObject<HTMLDivElement | null>
  projectId: string
}

function nodeContains(node: Node | null, other: EventTarget | null): boolean {
  return Boolean(node && other && (node === other || node.contains(other as Node)))
}

/**
 * One open tab: the request and response columns, wired to the tab's query runner actor. Only
 * the active tab is mounted, so this component also owns the keyboard shortcuts and the
 * paste-a-query-URL handler.
 */
export function QueryTab({tab, rootRef, projectId}: QueryTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const copyToClipboard = useCopyToClipboard()
  const actorRef = useVistaActor()
  const {layout} = useVistaExperience()
  const datasets = useVistaSelector((snapshot) => snapshot.context.defaults.datasets)
  const runnerRef = useVistaSelector((snapshot) => snapshot.context.runners[tab.id])
  const loadRevision = useVistaSelector((snapshot) => snapshot.context.loadRevisions[tab.id] || 0)

  const splitContainerRef = useRef<HTMLDivElement | null>(null)
  const splitContainerSize = useElementSize(splitContainerRef)
  // Dragged sizes are remembered per layout: a column width makes no sense as a stacked height
  const [splitSizes, setSplitSizes] = useState<Partial<Record<VistaLayout, number>>>({})
  const [mobilePane, setMobilePane] = useState<MobilePane>('request')

  const queryEditorRef = useRef<VisionCodeMirrorHandle>(null)
  const paramsEditorRef = useRef<VisionCodeMirrorHandle>(null)

  const {resolved, params, request} = useQueryRequestBuilder(tab)
  const isFetching = useSelector(runnerRef, (snapshot) => snapshot.matches({request: 'fetching'}))
  const liveError = useSelector(runnerRef, (snapshot) => snapshot.context.liveError)

  const run = useCallback(
    (reason: FetchReason) => {
      if (request) {
        runnerRef.send({type: 'fetch', request, reason})
        // On a phone the result lives behind the other pane; bring it forward
        if (layout === 'mobile') setMobilePane('response')
      }
    },
    [layout, request, runnerRef],
  )
  const cancel = useCallback(() => runnerRef.send({type: 'cancel'}), [runnerRef])

  const setQuery = useCallback(
    (query: string) => actorRef.send({type: 'tab.setQuery', id: tab.id, query}),
    [actorRef, tab.id],
  )
  const setParams = useCallback(
    (rawParams: string) => actorRef.send({type: 'tab.setParams', id: tab.id, rawParams}),
    [actorRef, tab.id],
  )
  const setOptions = useCallback(
    (options: Partial<VistaTabOptions>) =>
      actorRef.send({type: 'tab.setOptions', id: tab.id, options}),
    [actorRef, tab.id],
  )
  const setAutoRefetch = useCallback(
    (autoRefetch: boolean) => actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch}),
    [actorRef, tab.id],
  )

  const prettify = useCallback(() => {
    try {
      const formatted = formatGroq(tab.query)
      if (formatted !== tab.query) {
        queryEditorRef.current?.resetEditorContent(formatted)
        setQuery(formatted)
      }
    } catch {
      toast.push({closable: true, status: 'warning', title: t('vista.query.prettify.failed')})
    }
  }, [setQuery, t, tab.query, toast])

  const copyQuery = useCallback(
    () => void copyToClipboard(tab.query, t('vista.query.copied')),
    [copyToClipboard, t, tab.query],
  )

  // A query loaded from outside the editors (saved query, pasted URL) replaces their content
  // and drops the previous response
  const applyLoadedQuery = useEffectEvent(() => {
    queryEditorRef.current?.resetEditorContent(tab.query)
    paramsEditorRef.current?.resetEditorContent(tab.rawParams)
    runnerRef.send({type: 'clear'})
  })
  const previousLoadRevision = useRef(loadRevision)
  useEffect(() => {
    if (previousLoadRevision.current === loadRevision) return
    previousLoadRevision.current = loadRevision
    applyLoadedQuery()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [loadRevision])

  // Live refetching through sync tags: the subscription follows the toggle and the dataset
  const liveBaseClient = useClient({apiVersion: LIVE_EVENTS_API_VERSION})
  const liveClient = useMemo(
    () => liveBaseClient.withConfig({dataset: tab.options.dataset}),
    [liveBaseClient, tab.options.dataset],
  )
  const liveEnabled = tab.autoRefetch && resolved.supportsSyncTags
  useEffect(() => {
    if (liveEnabled) {
      runnerRef.send({type: 'live.enable', client: liveClient})
    } else {
      runnerRef.send({type: 'live.disable'})
    }
  }, [liveClient, liveEnabled, runnerRef])

  useEffect(() => {
    if (liveError) {
      toast.push({
        closable: true,
        id: `vista-live-error-${tab.id}`,
        status: 'warning',
        title: t('vista.live.error', {message: liveError.message}),
      })
    }
  }, [liveError, t, tab.id, toast])

  // While refetching automatically, changed options are applied right away
  const optionsKey = JSON.stringify([
    resolved.apiVersion,
    tab.options.dataset,
    resolved.perspective,
    resolved.variant,
    tab.options.includeSourceMap,
  ])
  const refetchForOptions = useEffectEvent(() => {
    if (tab.autoRefetch && request) {
      runnerRef.send({type: 'fetch', request, reason: {type: 'options'}})
    }
  })
  const previousOptionsKey = useRef(optionsKey)
  useEffect(() => {
    if (previousOptionsKey.current === optionsKey) return
    previousOptionsKey.current = optionsKey
    refetchForOptions()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [optionsKey])

  // Follow the studio navbar: pinning another release or perspective there switches the tab to
  // the "Pinned release" perspective, as the classic tool does
  const {perspectiveStack} = usePerspective()
  const stackKey = perspectiveStack.join(',')
  const followNavbar = useEffectEvent(() => {
    if (perspectiveStack.length > 0 && tab.options.perspective !== 'pinnedRelease') {
      setOptions({perspective: 'pinnedRelease'})
    }
  })
  const previousStackKey = useRef(stackKey)
  useEffect(() => {
    if (previousStackKey.current === stackKey) return
    previousStackKey.current = stackKey
    followNavbar()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [stackKey])

  const loadFromUrl = useEffectEvent((text: string): boolean => {
    const parsed = parseQueryUrl(text, datasets)
    if (!parsed) {
      return false
    }
    const options: Partial<VistaTabOptions> = {}
    if (parsed.dataset) options.dataset = parsed.dataset
    if (parsed.apiVersion) {
      if (API_VERSIONS.includes(parsed.apiVersion)) {
        options.apiVersion = parsed.apiVersion
        options.customApiVersion = false
      } else {
        options.customApiVersion = parsed.apiVersion
      }
    }
    if (parsed.perspective) options.perspective = parsed.perspective

    actorRef.send({
      type: 'tab.load',
      id: tab.id,
      tab: {query: parsed.query, rawParams: parsed.rawParams, options},
    })
    toast.push({closable: true, id: 'vista-paste', status: 'info', title: t('vista.paste.parsed')})
    if (parsed.hasUnsupportedPerspective) {
      toast.push({
        closable: true,
        id: 'vista-paste-perspective',
        status: 'warning',
        title: t('vista.paste.unsupported-perspective'),
      })
    }
    return true
  })

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!nodeContains(rootRef.current, event.target)) return
    const shortcut = matchVistaShortcut(event)
    if (!shortcut) return
    event.preventDefault()
    event.stopPropagation()
    if (shortcut === 'fetch') {
      run({type: 'shortcut'})
    } else if (shortcut === 'prettify') {
      prettify()
    } else if (shortcut === 'copy-query') {
      copyQuery()
    }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleShortcut(event)
    const onPaste = (event: ClipboardEvent) => {
      if (!event.clipboardData || !isVisionPasteTarget(rootRef.current, event)) return
      // Only claim the paste once the clipboard is known to hold a query URL, so anything else
      // still pastes natively
      if (loadFromUrl(event.clipboardData.getData('text/plain'))) {
        event.preventDefault()
      }
    }
    window.document.addEventListener('keydown', onKeyDown)
    window.document.addEventListener('paste', onPaste)
    return () => {
      window.document.removeEventListener('keydown', onKeyDown)
      window.document.removeEventListener('paste', onPaste)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [rootRef])

  const requestPanel = (
    <RequestPanel
      datasets={datasets}
      isFetching={isFetching}
      onCancel={cancel}
      onCopyQuery={copyQuery}
      onOptionsChange={setOptions}
      onParamsChange={setParams}
      onPrettify={prettify}
      onQueryChange={setQuery}
      onRun={() => run({type: 'manual'})}
      onToggleAutoRefetch={() => setAutoRefetch(!tab.autoRefetch)}
      params={params}
      paramsEditorRef={paramsEditorRef}
      projectId={projectId}
      queryEditorRef={queryEditorRef}
      request={request}
      resolved={resolved}
      tab={tab}
    />
  )
  const responsePanel = <ResponsePanel resolved={resolved} runnerRef={runnerRef} tab={tab} />

  const panelProps = {
    'aria-labelledby': getQueryTabId(tab.id),
    'data-testid': 'vista-query-tab',
    'id': QUERY_TAB_PANEL_ID,
    'role': 'tabpanel',
  } as const

  if (layout === 'mobile') {
    // Both panes stay mounted so the editors keep their state while hidden
    return (
      <Flex {...panelProps} flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0">
        <Flex borderBottom flexShrink={0} justifyContent="center" paddingY={1}>
          <TabList gap={1}>
            <Tab
              aria-controls="vista-mobile-request-pane"
              fontSize={1}
              id="vista-mobile-request-tab"
              label={t('query.label')}
              onClick={() => setMobilePane('request')}
              padding={2}
              selected={mobilePane === 'request'}
            />
            <Tab
              aria-controls="vista-mobile-response-pane"
              fontSize={1}
              id="vista-mobile-response-tab"
              label={t('result.label')}
              onClick={() => setMobilePane('response')}
              padding={2}
              selected={mobilePane === 'response'}
            />
          </TabList>
        </Flex>
        <Box
          className={cx(paneFill, mobilePane !== 'request' && hiddenPane)}
          flexBasis="0%"
          flexGrow={1}
          id="vista-mobile-request-pane"
        >
          {requestPanel}
        </Box>
        <Box
          className={cx(paneFill, mobilePane !== 'response' && hiddenPane)}
          flexBasis="0%"
          flexGrow={1}
          id="vista-mobile-response-pane"
        >
          {responsePanel}
        </Box>
      </Flex>
    )
  }

  const minSize = MIN_PANE_SIZE[layout]
  const defaultSplitSize = Math.max(
    minSize,
    Math.floor((layout === 'stacked' ? splitContainerSize.height : splitContainerSize.width) / 2),
  )

  return (
    <Box {...panelProps} className={splitPaneContainer} ref={splitContainerRef}>
      <SplitPane
        key={layout}
        minSize={minSize}
        onChange={(size: number) => setSplitSizes((sizes) => ({...sizes, [layout]: size}))}
        size={splitSizes[layout] ?? defaultSplitSize}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- layout mode, not user-facing text
        split={layout === 'stacked' ? 'horizontal' : 'vertical'}
      >
        <Box className={paneFill}>{requestPanel}</Box>
        <Box className={paneFill}>{responsePanel}</Box>
      </SplitPane>
    </Box>
  )
}

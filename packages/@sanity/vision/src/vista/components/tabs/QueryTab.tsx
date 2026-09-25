import {SplitPane} from '@rexxars/react-split-pane'
import {Tab, TabList} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import debounce from 'lodash-es/debounce.js'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'
import {useEffectEvent} from 'use-effect-event'

import {type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../../../i18n'
import {parseQueryUrl} from '../../../util/parseQueryUrl'
import {useContentSize} from '../../hooks/useContentSize'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {useFollowNavbarPerspective} from '../../hooks/useFollowNavbarPerspective'
import {useLiveSubscription} from '../../hooks/useLiveSubscription'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {useVistaDocumentEvents} from '../../hooks/useVistaDocumentEvents'
import {selectIsFetching} from '../../store/queryRunnerMachine'
import {type FetchReason, type VistaTab, type VistaTabOptions} from '../../store/types'
import {
  useVistaActor,
  useVistaExperience,
  useVistaSelector,
  type VistaLayout,
} from '../../store/VistaActorContext'
import {selectDatasets} from '../../store/vistaMachine'
import {cx} from '../../util/cx'
import {type QueryLintFinding} from '../../util/groqLint'
import {formatGroq, GroqSyntaxError} from '../../util/groqWasm'
import {parsedQueryToTabInit} from '../../util/savedQueryTab'
import {type VistaShortcutId} from '../../util/shortcuts'
import {RequestPanel} from '../request/RequestPanel'
import {ResponsePanel} from '../response/ResponsePanel'
import {hiddenPane, paneFill, splitPaneContainer} from '../vista.css'
import {getQueryTabId, QUERY_TAB_PANEL_ID} from './QueryTabBar'

const MIN_PANE_SIZE = {columns: 280, stacked: 160}

function countLines(text: string): number {
  let lines = 1
  for (let index = text.indexOf('\n'); index !== -1; index = text.indexOf('\n', index + 1)) {
    lines++
  }
  return lines
}
/**
 * The request pane's initial share of the split. Stacked, it holds the query editor and the
 * params and options panels, so it starts out taller than the result.
 */
const DEFAULT_REQUEST_SHARE = {columns: 0.5, stacked: 0.6}
/** Params are parsed on every change, so typing is debounced like in the classic tool */
const PARAMS_DEBOUNCE_MS = 333

type MobilePane = 'request' | 'response'

interface QueryTabProps {
  tab: VistaTab
  /** The tool's root element; keyboard shortcuts and pastes outside it are ignored */
  rootElement: HTMLDivElement | null
}

/**
 * One open tab: the request and response columns, wired to the tab's query runner actor. Only
 * the active tab is mounted, so this component also owns the keyboard shortcuts and the
 * paste-a-query-URL handler.
 */
export function QueryTab({tab, rootElement}: QueryTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const copyToClipboard = useCopyToClipboard()
  const actorRef = useVistaActor()
  const {layout} = useVistaExperience()
  const datasets = useVistaSelector(selectDatasets)
  const runnerRef = useVistaSelector((snapshot) => snapshot.context.runners[tab.id])
  const loadRevision = useVistaSelector((snapshot) => snapshot.context.loadRevisions[tab.id] || 0)

  const [splitContainer, setSplitContainer] = useState<HTMLDivElement | null>(null)
  const splitContainerSize = useContentSize(splitContainer)
  // Dragged sizes are remembered per layout: a column width makes no sense as a stacked height
  const [splitSizes, setSplitSizes] = useState<Partial<Record<VistaLayout, number>>>({})
  const [mobilePane, setMobilePane] = useState<MobilePane>('request')

  const queryEditorRef = useRef<VisionCodeMirrorHandle>(null)
  const paramsEditorRef = useRef<VisionCodeMirrorHandle>(null)
  // The query editor's diagnostics, listed in the response column's Lint panel
  const [lintFindings, setLintFindings] = useState<QueryLintFinding[]>([])

  const {resolved, params, request, buildRequest} = useQueryRequestBuilder(tab)
  const isFetching = useSelector(runnerRef, selectIsFetching)

  const setQuery = useCallback(
    (query: string) => actorRef.send({type: 'tab.setQuery', id: tab.id, query}),
    [actorRef, tab.id],
  )
  const setParamsNow = useCallback(
    (rawParams: string) => actorRef.send({type: 'tab.setParams', id: tab.id, rawParams}),
    [actorRef, tab.id],
  )
  const setParams = useMemo(() => debounce(setParamsNow, PARAMS_DEBOUNCE_MS), [setParamsNow])
  useEffect(() => () => setParams.flush(), [setParams])

  const run = useCallback(
    (reason: FetchReason) => {
      // Params typed within the debounce window belong to this fetch, so commit them first and
      // build the request from what the machine holds now rather than from the last render
      setParams.flush()
      const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id) ?? tab
      const current = buildRequest(latest.query, latest.rawParams)
      if (current) {
        runnerRef.send({type: 'fetch', request: current, reason})
        // On a phone the result lives behind the other pane; bring it forward
        if (layout === 'mobile') setMobilePane('response')
      }
    },
    [actorRef, buildRequest, layout, runnerRef, setParams, tab],
  )
  const cancel = useCallback(() => runnerRef.send({type: 'cancel'}), [runnerRef])
  const setOptions = useCallback(
    (options: Partial<VistaTabOptions>) =>
      actorRef.send({type: 'tab.setOptions', id: tab.id, options}),
    [actorRef, tab.id],
  )
  const toggleAutoRefetch = useCallback(() => {
    const autoRefetch = !tab.autoRefetch
    actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch})
    if (!autoRefetch) return
    // Live refetches replay the runner's last request, which may date from before the options
    // (or the query) changed while refetching was off; a session starts from the current one.
    // Params typed within the debounce window belong to that session, so commit them first and
    // build the request from what the machine holds now, as `run` does
    setParams.flush()
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id) ?? tab
    const current = buildRequest(latest.query, latest.rawParams)
    const lastRequest = runnerRef.getSnapshot().context.request
    if (
      current &&
      (lastRequest?.url !== current.url ||
        lastRequest.includeSourceMap !== current.includeSourceMap)
    ) {
      runnerRef.send({type: 'fetch', request: current, reason: {type: 'manual'}})
    }
  }, [actorRef, buildRequest, runnerRef, setParams, tab])

  const prettify = useCallback(async () => {
    const {query} = tab
    const editor = queryEditorRef.current
    try {
      // Wrap at the width the editor has, so the result needs no sideways scrolling. Formatting
      // changes the line count, and with it the line-number gutter's width and whether a
      // vertical scrollbar takes space, so measure again for the result and format once more
      // while that leaves fewer columns
      let width = editor?.getVisibleColumns()
      let formatted = await formatGroq(query, width)
      for (let pass = 0; pass < 2 && width !== undefined; pass++) {
        const nextWidth = editor?.getVisibleColumns(countLines(formatted))
        if (nextWidth === undefined || nextWidth >= width) break
        width = nextWidth
        formatted = await formatGroq(query, width)
      }
      // The formatter loads lazily; a query edited meanwhile is not overwritten
      const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id)
      if (latest?.query !== query || formatted === query) return
      queryEditorRef.current?.resetEditorContent(formatted)
      setQuery(formatted)
    } catch (error) {
      toast.push({
        closable: true,
        description: error instanceof GroqSyntaxError ? error.message : undefined,
        status: 'warning',
        title: t('vista.query.prettify.failed'),
      })
    }
  }, [actorRef, setQuery, t, tab, toast])

  const copyQuery = useCallback(
    () => void copyToClipboard(tab.query, t('vista.query.copied')),
    [copyToClipboard, t, tab.query],
  )

  // A finding picked while the phone shows the response pane: the editor is still `display: none`
  // in this render, so it cannot take focus until the request pane has been shown
  const pendingRevealRef = useRef<QueryLintFinding | null>(null)
  const revealLintFinding = useCallback(
    (finding: QueryLintFinding) => {
      if (layout === 'mobile' && mobilePane !== 'request') {
        pendingRevealRef.current = finding
        setMobilePane('request')
        return
      }
      queryEditorRef.current?.selectRange(finding.from, finding.to)
    },
    [layout, mobilePane],
  )
  useEffect(() => {
    const pending = pendingRevealRef.current
    if (mobilePane !== 'request' || !pending) return
    pendingRevealRef.current = null
    queryEditorRef.current?.selectRange(pending.from, pending.to)
  }, [mobilePane])

  // A query loaded from outside the editors (saved query, pasted URL) replaces their content
  // and drops the previous response; an edit still waiting in the debounce belongs to the
  // replaced params and must not write them back
  useOnValueChange(loadRevision, () => {
    setParams.cancel()
    queryEditorRef.current?.resetEditorContent(tab.query)
    paramsEditorRef.current?.resetEditorContent(tab.rawParams)
    runnerRef.send({type: 'clear'})
  })

  useLiveSubscription({
    runnerRef,
    dataset: resolved.dataset,
    enabled: tab.autoRefetch && resolved.supportsSyncTags,
    tabId: tab.id,
  })

  // A tab that refetches automatically resumes with a current result when it mounts. After a
  // reload its runner has nothing to replay, so the tab's query runs. Otherwise only what
  // automatic refetching applies anyway is caught up on: the options may have changed while the
  // tab was in the background (a navbar perspective change reaches every tab), so the last
  // request is fetched again under the current ones. Query and params typed in the editors but
  // never run stay unsent, as they do while the tab is shown
  const resumeAutoRefetch = useEffectEvent(() => {
    if (!tab.autoRefetch) return
    const lastRequest = runnerRef.getSnapshot().context.request
    if (!lastRequest) {
      if (request) runnerRef.send({type: 'fetch', request, reason: {type: 'resume'}})
      return
    }
    const current = buildRequest(lastRequest.query, JSON.stringify(lastRequest.params))
    if (
      current &&
      (current.url !== lastRequest.url || current.includeSourceMap !== lastRequest.includeSourceMap)
    ) {
      runnerRef.send({type: 'fetch', request: current, reason: {type: 'resume'}})
    }
  })
  useEffect(() => {
    resumeAutoRefetch()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- once per tab mount; useEffectEvent callbacks must not be listed
  }, [])

  // While refetching automatically, a request that changed outside the editors is fetched right
  // away: changed options, or a loaded query (live refetches replay the runner's last request,
  // which the load has just cleared)
  const refetchKey = `${loadRevision}|${JSON.stringify([
    resolved.apiVersion,
    resolved.dataset,
    resolved.perspective,
    resolved.variant,
    tab.options.includeSourceMap,
  ])}`
  useOnValueChange(refetchKey, (key, previous) => {
    if (tab.autoRefetch && request) {
      const loaded = key.split('|', 1)[0] !== previous.split('|', 1)[0]
      runnerRef.send({type: 'fetch', request, reason: {type: loaded ? 'load' : 'options'}})
    }
  })

  useFollowNavbarPerspective(tab.options.perspective, (perspective) => setOptions({perspective}))

  useVistaDocumentEvents({
    rootElement,
    onShortcut: (shortcut: VistaShortcutId) => {
      switch (shortcut) {
        case 'fetch':
          run({type: 'shortcut'})
          break
        case 'prettify':
          void prettify()
          break
        case 'copy-query':
          copyQuery()
          break
        default: {
          const unhandled: never = shortcut
          throw new Error(`Unhandled shortcut: ${String(unhandled)}`)
        }
      }
    },
    onPaste: (text) => {
      const parsed = parseQueryUrl(text, datasets)
      if (!parsed) {
        return false
      }
      actorRef.send({type: 'tab.load', id: tab.id, tab: parsedQueryToTabInit(parsed)})
      toast.push({
        closable: true,
        id: 'vista-paste',
        status: 'info',
        title: t('vista.paste.parsed'),
      })
      if (parsed.hasUnsupportedPerspective) {
        toast.push({
          closable: true,
          id: 'vista-paste-perspective',
          status: 'warning',
          title: t('vista.paste.unsupported-perspective'),
        })
      }
      return true
    },
  })

  const requestPanel = (
    <RequestPanel
      isFetching={isFetching}
      onCancel={cancel}
      onCopyQuery={copyQuery}
      onLintFindings={setLintFindings}
      onOptionsChange={setOptions}
      onParamsChange={setParams}
      onPrettify={() => void prettify()}
      onQueryChange={setQuery}
      onRun={() => run({type: 'manual'})}
      onToggleAutoRefetch={toggleAutoRefetch}
      params={params}
      paramsEditorRef={paramsEditorRef}
      queryEditorRef={queryEditorRef}
      request={request}
      resolved={resolved}
      tab={tab}
    />
  )
  const responsePanel = (
    <ResponsePanel
      lintFindings={lintFindings}
      onRevealLintFinding={revealLintFinding}
      request={request}
      resolved={resolved}
      runnerRef={runnerRef}
      tab={tab}
    />
  )

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
          aria-labelledby="vista-mobile-request-tab"
          className={cx(paneFill, mobilePane !== 'request' && hiddenPane)}
          flexBasis="0%"
          flexGrow={1}
          id="vista-mobile-request-pane"
          role="tabpanel"
        >
          {requestPanel}
        </Box>
        <Box
          aria-labelledby="vista-mobile-response-tab"
          className={cx(paneFill, mobilePane !== 'response' && hiddenPane)}
          flexBasis="0%"
          flexGrow={1}
          id="vista-mobile-response-pane"
          role="tabpanel"
        >
          {responsePanel}
        </Box>
      </Flex>
    )
  }

  const minSize = MIN_PANE_SIZE[layout]
  const containerExtent =
    layout === 'stacked' ? splitContainerSize?.height : splitContainerSize?.width
  const defaultSplitSize = Math.max(
    minSize,
    Math.floor((containerExtent || 0) * DEFAULT_REQUEST_SHARE[layout]),
  )

  return (
    <Box {...panelProps} className={splitPaneContainer} ref={setSplitContainer}>
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

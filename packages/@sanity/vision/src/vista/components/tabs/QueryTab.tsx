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
  usePendingEdits,
  useVistaActor,
  useVistaExperience,
  useVistaSelector,
  type VistaLayout,
} from '../../store/VistaActorContext'
import {isPanelExpanded, selectDatasets, selectParamsView} from '../../store/vistaMachine'
import {cx} from '../../util/cx'
import {type TextRange} from '../../util/groqFunctions'
import {type QueryLintFinding} from '../../util/groqLint'
import {formatGroq, GroqSyntaxError} from '../../util/groqWasm'
import {parsedQueryToTabInit} from '../../util/savedQueryTab'
import {type VistaShortcutId} from '../../util/shortcuts'
import {RequestPanel} from '../request/RequestPanel'
import {ResizableSplit} from '../ResizableSplit'
import {type QueryEdit} from '../response/FunctionsTab'
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
/**
 * A tab opened for a generated query lays out over its first frames (the split measures its
 * container), so the editor's width counts once it has stayed the same this many frames
 */
const SETTLED_LAYOUT_FRAMES = 3
const MAX_LAYOUT_FRAMES = 30

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
  // Save and Export (in the menu and in the sidebar) commit a params edit still waiting in the
  // debounce before they read the tab, as Run does
  const pendingEdits = usePendingEdits()
  useEffect(() => pendingEdits.register(() => setParams.flush()), [pendingEdits, setParams])
  // Collapsing the Params panel unmounts its editor, and expanding it seeds a new one from the
  // tab; an edit still waiting in the debounce is committed first so the new editor shows it
  const paramsExpanded = useVistaSelector((snapshot) => isPanelExpanded(snapshot, 'params'))
  useOnValueChange(paramsExpanded, (expanded) => {
    if (!expanded) setParams.flush()
  })
  // Switching between the editor and the form unmounts one and mounts the other from the tab
  const paramsView = useVistaSelector(selectParamsView)
  useOnValueChange(paramsView, () => setParams.flush())
  // The form shows the tab's params, so its edits are committed right away; an editor edit still
  // waiting in the debounce would write older params over them
  const replaceParams = useCallback(
    (rawParams: string) => {
      setParams.cancel()
      setParamsNow(rawParams)
    },
    [setParams, setParamsNow],
  )

  // The request a fetch of the tab's own query should carry right now: params typed within the
  // debounce window belong to it, so they are committed first and the request is built from what
  // the machine holds now rather than from the last render. Every such fetch (a run, an options
  // change, a load, resuming after a reload) goes through this; live refetches replay the
  // runner's last request instead
  const buildCurrentRequest = useCallback(() => {
    setParams.flush()
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id) ?? tab
    return buildRequest(latest.query, latest.rawParams)
  }, [actorRef, buildRequest, setParams, tab])

  const run = useCallback(
    (reason: FetchReason): boolean => {
      const current = buildCurrentRequest()
      if (!current) return false
      runnerRef.send({type: 'fetch', request: current, reason})
      // On a phone the result lives behind the other pane; bring it forward
      if (layout === 'mobile') setMobilePane('response')
      return true
    },
    [buildCurrentRequest, layout, runnerRef],
  )
  const cancel = useCallback(() => runnerRef.send({type: 'cancel'}), [runnerRef])
  const refetchAfterMutations = useCallback(() => {
    run({type: 'mutation'})
  }, [run])
  const setOptions = useCallback(
    (options: Partial<VistaTabOptions>) =>
      actorRef.send({type: 'tab.setOptions', id: tab.id, options}),
    [actorRef, tab.id],
  )
  // Live is an alternative to Fetch: it fetches the current request (live refetches replay the
  // runner's last one, which may date from before the options or the query changed), and then
  // refetches automatically until stopped
  const toggleAutoRefetch = useCallback(() => {
    if (tab.autoRefetch) {
      actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch: false})
    } else if (run({type: 'live-start'})) {
      actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch: true})
    }
  }, [actorRef, run, tab.autoRefetch, tab.id])

  // Formats the query in place, wrapping at the width the editor has so the result needs no
  // sideways scrolling. Formatting changes the line count, and with it the line-number gutter's
  // width and whether a vertical scrollbar takes space, so the result is measured again and
  // formatted once more while that leaves fewer columns. Rejects when the query does not parse.
  const formatQuery = useCallback(async () => {
    const {query} = tab
    const editor = queryEditorRef.current
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
  }, [actorRef, setQuery, tab])

  const prettify = useCallback(async () => {
    try {
      await formatQuery()
    } catch (error) {
      toast.push({
        closable: true,
        description: error instanceof GroqSyntaxError ? error.message : undefined,
        status: 'warning',
        title: t('vista.query.prettify.failed'),
      })
    }
  }, [formatQuery, t, toast])

  const copyQuery = useCallback(
    () => void copyToClipboard(tab.query, t('vista.query.copied')),
    [copyToClipboard, t, tab.query],
  )

  // A lint finding or a function declaration picked while the phone shows the response pane: the
  // editor is still `display: none` in this render, so it cannot take focus until the request
  // pane has been shown
  const pendingRevealRef = useRef<TextRange | null>(null)
  const revealRange = useCallback(
    (range: TextRange) => {
      if (layout === 'mobile' && mobilePane !== 'request') {
        pendingRevealRef.current = range
        setMobilePane('request')
        return
      }
      queryEditorRef.current?.selectRange(range.from, range.to)
    },
    [layout, mobilePane],
  )
  // The Functions panel declares and replaces functions through the editor, so they can be undone
  const editQuery = useCallback(
    (edit: QueryEdit) => queryEditorRef.current?.applyChanges([edit]),
    [],
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
      const current = buildCurrentRequest()
      if (current) runnerRef.send({type: 'fetch', request: current, reason: {type: 'resume'}})
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
  // A generated query, in a tab opened for it or loaded into this one, is laid out for the
  // editor, as Prettify does, and its result shown straight away; a query the formatter cannot
  // read runs as it was written. The editor creates its view a render after it mounts and the
  // tab's panes settle over the frames after that, so the query is formatted once the editor's
  // width has stopped changing (half a second at most; without a width it is formatted at the
  // default one)
  const generatedQueryPending = useVistaSelector((snapshot) =>
    snapshot.context.fetchOnOpen.includes(tab.id),
  )
  const fetchGeneratedQuery = useEffectEvent(async () => {
    if (!actorRef.getSnapshot().context.fetchOnOpen.includes(tab.id)) return
    actorRef.send({type: 'tab.fetchedOnOpen', id: tab.id})
    let previousColumns: number | undefined
    let settledFrames = 0
    for (let frame = 0; frame < MAX_LAYOUT_FRAMES; frame++) {
      const columns = queryEditorRef.current?.getVisibleColumns()
      settledFrames = columns !== undefined && columns === previousColumns ? settledFrames + 1 : 0
      if (settledFrames >= SETTLED_LAYOUT_FRAMES) break
      previousColumns = columns
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    await formatQuery().catch(() => undefined)
    run({type: 'generated'})
  })
  useEffect(() => {
    resumeAutoRefetch()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- once per tab mount; useEffectEvent callbacks must not be listed
  }, [])
  useEffect(() => {
    if (generatedQueryPending) void fetchGeneratedQuery()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [generatedQueryPending])

  // While refetching automatically, a request that changed outside the editors is fetched right
  // away: changed options, or a loaded query (live refetches replay the runner's last request,
  // which the load has just cleared)
  const refetchKey = `${loadRevision}|${JSON.stringify([
    resolved.apiVersion,
    resolved.dataset,
    resolved.perspective,
    resolved.variant,
    resolved.useCdn,
    tab.options.includeSourceMap,
  ])}`
  useOnValueChange(refetchKey, (key, previous) => {
    if (!tab.autoRefetch) return
    const loaded = key.split('|', 1)[0] !== previous.split('|', 1)[0]
    // Built like a manual run, so params typed just before an option changed come along (after
    // a load there is nothing waiting: the edit that belonged to the replaced params was cancelled)
    const current = buildCurrentRequest()
    if (current) {
      runnerRef.send({type: 'fetch', request: current, reason: {type: loaded ? 'load' : 'options'}})
    }
  })

  // A stored scheduled drafts choice already reads as global where this workspace has no
  // scheduled drafts, so a navbar change leaves it stored for the workspaces that do
  useFollowNavbarPerspective(resolved.tabPerspective, (perspective) => setOptions({perspective}))

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
      // The URL may come from another project or name a dataset the user cannot see; the query
      // then runs against the tab's own dataset, which is worth saying
      if (!parsed.isKnownDataset) {
        toast.push({
          closable: true,
          id: 'vista-paste-dataset',
          status: 'warning',
          title: t('vista.paste.unknown-dataset', {dataset: parsed.dataset}),
        })
      }
      // A tab cannot pin a variant (its option follows the navbar or sends none), so a request
      // made with one the navbar does not have selected cannot be reproduced as pasted
      if (parsed.variant !== undefined && parsed.variant !== resolved.variant) {
        toast.push({
          closable: true,
          id: 'vista-paste-variant',
          status: 'warning',
          title: t('vista.paste.unavailable-variant', {variant: parsed.variant}),
        })
      }
      return true
    },
  })

  const requestPanel = (
    <RequestPanel
      buildRequest={buildRequest}
      isFetching={isFetching}
      onCancel={cancel}
      onCopyQuery={copyQuery}
      onLintFindings={setLintFindings}
      onOptionsChange={setOptions}
      onParamsChange={setParams}
      onParamsReplace={replaceParams}
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
      onEditQuery={editQuery}
      onMutationsApplied={refetchAfterMutations}
      onRevealRange={revealRange}
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

  // Both panes keep the minimum: the divider stops short of either, and a size dragged in a
  // wider window is clamped by the split for as long as the window is narrower (the request
  // pane, with its three panels, wins when there is no room for both)
  return (
    <Box {...panelProps} className={splitPaneContainer} ref={setSplitContainer}>
      <ResizableSplit
        key={layout}
        label={t('vista.split.request-response')}
        minSecondarySize={minSize}
        minSize={minSize}
        onChange={(size) => setSplitSizes((sizes) => ({...sizes, [layout]: size}))}
        onReset={() => setSplitSizes((sizes) => ({...sizes, [layout]: undefined}))}
        size={splitSizes[layout] ?? defaultSplitSize}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- layout mode, not user-facing text
        split={layout === 'stacked' ? 'horizontal' : 'vertical'}
        testId="vista-split"
      >
        <Box className={paneFill}>{requestPanel}</Box>
        <Box className={paneFill}>{responsePanel}</Box>
      </ResizableSplit>
    </Box>
  )
}

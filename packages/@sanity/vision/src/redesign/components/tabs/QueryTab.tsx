import {Tab, TabList} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import debounce from 'lodash-es/debounce.js'
import {useCallback, useEffect, useMemo, useRef, useState, useEffectEvent} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {type VisionQueryRunData} from '../../../__telemetry__/vision.telemetry'
import {type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {useVariantsEnabled} from '../../../hooks/useVariantsEnabled'
import {visionLocaleNamespace} from '../../../i18n'
import {useAutoFormatOnResize} from '../../hooks/useAutoFormatOnResize'
import {useContentSize} from '../../hooks/useContentSize'
import {useCopiedFeedback} from '../../hooks/useCopiedFeedback'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {useFollowNavbarPerspective} from '../../hooks/useFollowNavbarPerspective'
import {useLiveSubscription} from '../../hooks/useLiveSubscription'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {useVisionDocumentEvents} from '../../hooks/useVisionDocumentEvents'
import {selectIsFetching, selectLiveConnected} from '../../store/queryRunnerMachine'
import {type FetchReason, type VisionTab, type VisionTabOptions} from '../../store/types'
import {
  usePendingEdits,
  useVisionActor,
  useVisionExperience,
  useVisionSelector,
} from '../../store/VisionActorContext'
import {
  selectDatasets,
  selectOpenDrawer,
  selectParamsView,
  selectSourceMapRequest,
  selectWorkspaceDataset,
} from '../../store/visionMachine'
import {fetchOnOpenReason} from '../../util/aiQueryChange'
import {cx} from '../../util/cx'
import {formatParams} from '../../util/formatParams'
import {type TextRange} from '../../util/groqFunctions'
import {type QueryLintFinding} from '../../util/groqLint'
import {formatGroq, GroqSyntaxError} from '../../util/groqWasm'
import {parseQueryPaste} from '../../util/parseQueryPaste'
import {parsedQueryToTabInit} from '../../util/savedQueryTab'
import {type VisionShortcutId} from '../../util/shortcuts'
import {useQueryTabSplitSizes} from '../queryTabLayout'
import * as styles from '../redesign.module.css'
import {isParamsContentTarget} from '../request/paramsContent'
import {RequestPanel} from '../request/RequestPanel'
import {ResizableSplit} from '../ResizableSplit'
import {type QueryEdit} from '../response/FunctionsTab'
import {ResponsePanel} from '../response/ResponsePanel'
import {getQueryTabId, QUERY_TAB_PANEL_ID} from './QueryTabBar'
import {useQueryTabShown, useTabElementId} from './queryTabShown'

const MIN_PANE_SIZE = {columns: 280, stacked: 160}

/** Fetch and the fetch shortcut. Reloads and setting changes are not query runs. */
function recordedQueryRun(reason: FetchReason, hasParams: boolean): VisionQueryRunData | null {
  switch (reason.type) {
    case 'manual':
      return {mode: 'fetch', trigger: 'button', hasParams}
    case 'shortcut':
      return {mode: 'fetch', trigger: 'shortcut', hasParams}
    case 'options':
    case 'load':
    case 'resume':
    case 'generated':
    case 'paste':
    case 'link':
    case 'live':
      return null
    default: {
      const unhandled: never = reason
      return unhandled
    }
  }
}

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

export interface QueryTabProps {
  /**
   * Whether the tab's panels play their entry transitions the first time it is shown. Only the
   * tab shown when the tool opens does: a tab opened or switched to afterwards appears at once
   */
  animateFirstShow: boolean
  tab: VisionTab
  /** The tool's root element; keyboard shortcuts and pastes outside it are ignored */
  rootElement: HTMLDivElement | null
}

/**
 * One open tab: the request and response columns, wired to the tab's query runner actor. Every
 * open tab stays mounted, the others hidden in an `<Activity>` boundary whose effects are torn
 * down, so the shown tab alone handles the keyboard shortcuts and the paste-a-query-URL handler
 * (both registered in effects), and its live subscription and fetches pause while it is hidden.
 */
export function QueryTab({animateFirstShow, tab, rootElement}: QueryTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const copyToClipboard = useCopyToClipboard()
  const actorRef = useVisionActor()
  const {layout} = useVisionExperience()
  const datasets = useVisionSelector(selectDatasets)
  const workspaceDataset = useVisionSelector(selectWorkspaceDataset)
  const telemetry = useVisionTelemetry()
  const runnerRef = useVisionSelector((snapshot) => snapshot.context.runners[tab.id])
  const loadRevision = useVisionSelector((snapshot) => snapshot.context.loadRevisions[tab.id] || 0)

  const tabElementId = useTabElementId()
  const [splitContainer, setSplitContainer] = useState<HTMLDivElement | null>(null)
  // A hidden tab is shown again with `display: none` lifted, which starts every
  // `@starting-style` transition inside it over. They are switched off for the frames around a
  // reveal (and a first show, unless the tab animates it), as the tab was already on screen
  const shown = useQueryTabShown()
  const [wasShown, setWasShown] = useState(shown)
  const [revealing, setRevealing] = useState(!animateFirstShow)
  if (shown !== wasShown) {
    setWasShown(shown)
    if (shown) setRevealing(true)
  }
  useEffect(() => {
    if (!shown || !revealing) return undefined
    let next = 0
    const first = requestAnimationFrame(() => {
      next = requestAnimationFrame(() => setRevealing(false))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(next)
    }
  }, [revealing, shown])
  const splitContainerSize = useContentSize(splitContainer)
  // Dragged sizes are remembered per layout: a column width makes no sense as a stacked height
  const {splitSizes, setSplitSizes, splitSnapped, setSplitSnapped} = useQueryTabSplitSizes()
  const [mobilePane, setMobilePane] = useState<MobilePane>('request')

  const queryEditorRef = useRef<VisionCodeMirrorHandle>(null)
  const paramsEditorRef = useRef<VisionCodeMirrorHandle>(null)
  // The query editor's diagnostics, listed in the request column's Lint tab
  const [lintFindings, setLintFindings] = useState<QueryLintFinding[]>([])

  const {resolved, params, request, buildRequest} = useQueryRequestBuilder(tab)
  const sourceMapPreference = useVisionSelector(selectSourceMapRequest)
  const isVariantsEnabled = useVariantsEnabled()
  const isFetching = useSelector(runnerRef, selectIsFetching)
  const liveConnected = useSelector(runnerRef, selectLiveConnected)

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
  // Export, Share and closing the tab commit a params edit still waiting in the debounce before
  // they read the tab, as Run does
  const pendingEdits = usePendingEdits()
  useEffect(() => pendingEdits.register(() => setParams.flush()), [pendingEdits, setParams])
  const flushParams = useCallback(() => setParams.flush(), [setParams])
  // Switching between the editor and the form unmounts one and mounts the other from the tab
  const paramsView = useVisionSelector(selectParamsView)
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
      const recorded = recordedQueryRun(reason, Object.keys(current.params).length > 0)
      if (recorded) telemetry.queryRun(recorded)
      runnerRef.send({type: 'fetch', request: current, reason})
      // On a phone the result lives behind the other pane; bring it forward
      if (layout === 'mobile') setMobilePane('response')
      return true
    },
    [buildCurrentRequest, layout, runnerRef, telemetry],
  )
  const cancel = useCallback(() => {
    telemetry.queryCancelled('fetch')
    runnerRef.send({type: 'cancel'})
  }, [runnerRef, telemetry])
  const setOptions = useCallback(
    (options: Partial<VisionTabOptions>) =>
      actorRef.send({type: 'tab.setOptions', id: tab.id, options}),
    [actorRef, tab.id],
  )
  // The navbar follows through `setOptions` and must not count as the user changing a setting
  const changeOptions = useCallback(
    (options: Partial<VisionTabOptions>) => {
      if (options.datasetMode !== undefined || options.dataset !== undefined) {
        const mode = options.datasetMode ?? tab.options.datasetMode
        const dataset =
          mode === 'auto' ? workspaceDataset : (options.dataset ?? tab.options.dataset)
        if (dataset !== resolved.dataset) telemetry.datasetChanged()
      }
      if ('perspective' in options && options.perspective !== tab.options.perspective) {
        telemetry.perspectiveChanged()
      }
      if (options.variant !== undefined && options.variant !== tab.options.variant) {
        telemetry.optionToggled('variant', options.variant === 'global')
      }
      if (
        options.includeSourceMap !== undefined &&
        options.includeSourceMap !== tab.options.includeSourceMap
      ) {
        telemetry.optionToggled('source-map', options.includeSourceMap)
      }
      if (options.useCdn !== undefined && options.useCdn !== tab.options.useCdn) {
        telemetry.optionToggled('cdn', options.useCdn)
      }
      setOptions(options)
    },
    [resolved.dataset, setOptions, tab.options, telemetry, workspaceDataset],
  )
  // Live only starts listening: the shown result stays until a relevant change refetches the
  // runner's last request, or until Fetch. Stopping it fetches nothing either
  const toggleAutoRefetch = useCallback(() => {
    if (tab.autoRefetch) {
      actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch: false})
      telemetry.queryCancelled('listen')
      return
    }
    const current = buildCurrentRequest()
    if (!current) return
    telemetry.queryRun({
      mode: 'listen',
      trigger: 'button',
      hasParams: Object.keys(current.params).length > 0,
    })
    actorRef.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch: true})
  }, [actorRef, buildCurrentRequest, tab.autoRefetch, tab.id, telemetry])

  // Formats a query to wrap at the width the editor has, so it needs no sideways scrolling.
  // Formatting changes the line count, and with it the line-number gutter's width and whether a
  // vertical scrollbar takes space, so the result is measured again and formatted once more while
  // that leaves fewer columns. Rejects when the query does not parse.
  const formatForEditor = useCallback(async (query: string) => {
    const editor = queryEditorRef.current
    let width = editor?.getVisibleColumns(countLines(query))
    let formatted = await formatGroq(query, width)
    for (let pass = 0; pass < 2 && width !== undefined; pass++) {
      const nextWidth = editor?.getVisibleColumns(countLines(formatted))
      if (nextWidth === undefined || nextWidth >= width) break
      width = nextWidth
      formatted = await formatGroq(query, width)
    }
    return formatted
  }, [])

  // Formats the query in place
  const formatQuery = useCallback(async () => {
    const {query} = tab
    const formatted = await formatForEditor(query)
    // The formatter loads lazily; a query edited meanwhile is not overwritten
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id)
    if (latest?.query !== query || formatted === query) return
    queryEditorRef.current?.resetEditorContent(formatted)
    setQuery(formatted)
  }, [actorRef, formatForEditor, setQuery, tab])

  const autoFormatOnResize = useVisionSelector(
    (snapshot) => snapshot.context.editor.autoFormatOnResize,
  )
  const autoFormatPending = useAutoFormatOnResize({
    container: splitContainer,
    layout,
    editorRef: queryEditorRef,
    enabled: autoFormatOnResize,
    query: tab.query,
    getQuery: () => actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id)?.query ?? '',
    formatForEditor,
    onFormatted: setQuery,
  })

  const prettify = useCallback(async () => {
    try {
      await formatQuery()
      telemetry.queryPrettified('success')
    } catch (error) {
      telemetry.queryPrettified('error')
      toast.push({
        closable: true,
        description: error instanceof GroqSyntaxError ? error.message : undefined,
        status: 'warning',
        title: t('vision.query.prettify.failed'),
      })
    }
  }, [formatQuery, t, telemetry, toast])

  // The Copy buttons in the editors' corners read Copied after a copy, rather than a toast saying so
  const {copied, markCopied} = useCopiedFeedback<'query' | 'params'>()
  const copyQuery = useCallback(() => {
    void copyToClipboard(tab.query).then((didCopy) => {
      if (!didCopy) return
      markCopied('query')
      telemetry.copied('query')
    })
  }, [copyToClipboard, markCopied, tab.query, telemetry])
  // The params as they are now, with an edit still waiting in the debounce
  const readLatestParams = useCallback(() => {
    setParams.flush()
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id)
    return latest?.rawParams ?? tab.rawParams
  }, [actorRef, setParams, tab.id, tab.rawParams])
  const copyParams = useCallback(() => {
    void copyToClipboard(readLatestParams()).then((didCopy) => {
      if (!didCopy) return
      markCopied('params')
      telemetry.copied('params')
    })
  }, [copyToClipboard, markCopied, readLatestParams, telemetry])
  // Formats the params in the JSON editor; the form has nothing to format
  const formatParamsJson = useCallback(() => {
    if (!paramsEditorRef.current) return
    const formatted = formatParams(readLatestParams())
    if (formatted === null) return
    paramsEditorRef.current.resetEditorContent(formatted)
    setParamsNow(formatted)
  }, [readLatestParams, setParamsNow])

  // A lint finding or a function declaration picked on a phone, where the editor is `display: none`
  // behind the response pane, or inert under a sidebar drawer, which covers the tool: it cannot
  // take focus until the request pane shows and the drawer has closed
  const pendingRevealRef = useRef<TextRange | null>(null)
  const drawerOpen = useVisionSelector((snapshot) => selectOpenDrawer(snapshot) !== null)
  const revealRange = useCallback(
    (range: TextRange) => {
      if (layout === 'mobile' && (mobilePane !== 'request' || drawerOpen)) {
        pendingRevealRef.current = range
        setMobilePane('request')
        if (drawerOpen) actorRef.send({type: 'drawer.close'})
        return
      }
      queryEditorRef.current?.selectRange(range.from, range.to)
    },
    [actorRef, drawerOpen, layout, mobilePane],
  )
  // The Functions panel declares and replaces functions through the editor, so they can be undone
  const editQuery = useCallback(
    (edit: QueryEdit) => queryEditorRef.current?.applyChanges([edit]),
    [],
  )
  useEffect(() => {
    const pending = pendingRevealRef.current
    if (mobilePane !== 'request' || drawerOpen || !pending) return
    pendingRevealRef.current = null
    queryEditorRef.current?.selectRange(pending.from, pending.to)
  }, [drawerOpen, mobilePane])

  // A query loaded from outside the editors (saved query, pasted URL) replaces their content
  // and drops the previous response; an edit still waiting in the debounce belongs to the
  // replaced params and must not write them back
  useOnValueChange(loadRevision, () => {
    setParams.cancel()
    queryEditorRef.current?.resetEditorContent(tab.query)
    paramsEditorRef.current?.resetEditorContent(tab.rawParams)
    runnerRef.send({type: 'clear'})
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
      (current.url !== lastRequest.url || current.resultSourceMap !== lastRequest.resultSourceMap)
    ) {
      runnerRef.send({type: 'fetch', request: current, reason: {type: 'resume'}})
    }
  })
  // A query the tab fetches as soon as it is shown, or right away when it already is. A generated
  // query, in a tab opened for it or loaded into this one, is laid out for the editor, as Prettify
  // does, and its result shown straight away; a query the formatter cannot read runs as it was
  // written. The editor creates its view a render after it mounts and the tab's panes settle over
  // the frames after that, so the query is formatted once the editor's width has stopped changing
  // (half a second at most; without a width it is formatted at the default one). A pasted query
  // URL runs as it was pasted, as the classic tool does, and so does one a link to the tool named
  const fetchOnOpen = useVisionSelector((snapshot) => snapshot.context.fetchOnOpen[tab.id])
  const fetchOpenedQuery = useEffectEvent(async () => {
    const source = actorRef.getSnapshot().context.fetchOnOpen[tab.id]
    if (!source) return
    actorRef.send({type: 'tab.fetchedOnOpen', id: tab.id})
    const reason = fetchOnOpenReason(source)
    if (reason.type === 'generated') {
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
    }
    run(reason)
  })
  useEffect(() => {
    resumeAutoRefetch()
  }, [])
  // After the resume above, whose fetch makes the paused subscription's catch-up refetch moot
  useLiveSubscription({
    runnerRef,
    dataset: resolved.dataset,
    enabled: tab.autoRefetch && resolved.supportsSyncTags,
    tabId: tab.id,
  })
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- a tab opened with fetch-on-open runs its query once, when it mounts
    if (fetchOnOpen) void fetchOpenedQuery()
  }, [fetchOnOpen])

  // While refetching automatically, a request that changed outside the editors is fetched right
  // away: changed options, or a loaded query (live refetches replay the runner's last request,
  // which the load has just cleared)
  const refetchKey = `${loadRevision}|${JSON.stringify([
    resolved.apiVersion,
    resolved.dataset,
    resolved.perspective,
    resolved.variant,
    resolved.useCdn,
    tab.options.includeSourceMap && sourceMapPreference,
  ])}`
  useOnValueChange(refetchKey, (key, previous) => {
    if (!tab.autoRefetch) return
    const loaded = key.split('|', 1)[0] !== previous.split('|', 1)[0]
    // A load that fetches on its own (a generated query, a pasted URL) is not fetched twice
    if (loaded && fetchOnOpen) return
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

  useVisionDocumentEvents({
    rootElement,
    onShortcut: (shortcut: VisionShortcutId, event: KeyboardEvent) => {
      // Copy and Format act on the params while the params panel has focus, else on the query
      const inParams = isParamsContentTarget(event.target)
      telemetry.shortcutUsed(shortcut)
      switch (shortcut) {
        case 'fetch':
          run({type: 'shortcut'})
          break
        case 'prettify':
          if (inParams) formatParamsJson()
          else void prettify()
          break
        case 'copy-query':
          if (inParams) copyParams()
          else copyQuery()
          break
        default: {
          const unhandled: never = shortcut
          throw new Error(`Unhandled shortcut: ${String(unhandled)}`)
        }
      }
    },
    onPaste: (text) => {
      const parsed = parseQueryPaste(text, datasets)
      if (!parsed) {
        return false
      }
      telemetry.queryUrlPasted()
      actorRef.send({
        type: 'tab.load',
        id: tab.id,
        tab: parsedQueryToTabInit(parsed),
        fetch: 'paste',
      })
      toast.push({
        closable: true,
        id: 'vision-paste',
        status: 'info',
        title: t(parsed.source === 'curl' ? 'vision.paste.parsed-curl' : 'vision.paste.parsed'),
      })
      if (parsed.hasUnsupportedPerspective) {
        toast.push({
          closable: true,
          id: 'vision-paste-perspective',
          status: 'warning',
          title: t('vision.paste.unsupported-perspective'),
        })
      }
      // The URL may come from another project or name a dataset the user cannot see; the query
      // then runs against the tab's own dataset, which is worth saying
      if (!parsed.isKnownDataset) {
        toast.push({
          closable: true,
          id: 'vision-paste-dataset',
          status: 'warning',
          title: t('vision.paste.unknown-dataset', {dataset: parsed.dataset}),
        })
      }
      // A tab cannot pin a variant (its option follows the navbar or sends none), so a request
      // made with one the navbar does not have selected cannot be reproduced as pasted; where
      // the workspace has variants switched off there is no navbar selector to select it with
      if (parsed.variant !== undefined && parsed.variant !== resolved.variant) {
        toast.push({
          closable: true,
          id: 'vision-paste-variant',
          status: 'warning',
          title: t(
            isVariantsEnabled
              ? 'vision.paste.unavailable-variant'
              : 'vision.paste.variants-disabled',
            {variant: parsed.variant},
          ),
        })
      }
      return true
    },
  })

  const requestPanel = (
    <RequestPanel
      autoFormatPending={autoFormatPending}
      buildRequest={buildRequest}
      formatForEditor={formatForEditor}
      isFetching={isFetching}
      liveConnected={liveConnected}
      onCancel={cancel}
      copied={copied}
      onCopyParams={copyParams}
      onCopyQuery={copyQuery}
      onFormatParams={formatParamsJson}
      lintFindings={lintFindings}
      onEditQuery={editQuery}
      onLintFindings={setLintFindings}
      onOptionsChange={changeOptions}
      onParamsChange={setParams}
      onParamsFlush={flushParams}
      onParamsReplace={replaceParams}
      onRevealRange={revealRange}
      onFormatQuery={() => void prettify()}
      onQueryChange={setQuery}
      onRun={() => run({type: 'manual'})}
      onParamsSubmit={() => run({type: 'shortcut'})}
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
      formatForEditor={formatForEditor}
      params={params.valid ? params.parsed : undefined}
      request={request}
      resolved={resolved}
      runnerRef={runnerRef}
      tab={tab}
    />
  )

  const panelProps = {
    'aria-labelledby': getQueryTabId(tab.id),
    'className': cx(revealing && styles.queryTabRevealing),
    'data-testid': 'vision-query-tab',
    'id': tabElementId(QUERY_TAB_PANEL_ID),
    'ref': setSplitContainer,
    'role': 'tabpanel',
  } as const

  if (layout === 'mobile') {
    // Both panes stay mounted so the editors keep their state while hidden
    return (
      <Flex {...panelProps} flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0">
        <Flex borderBottom flexShrink={0} justifyContent="center" paddingY={1}>
          <TabList gap={1}>
            <Tab
              aria-controls={tabElementId('vision-mobile-request-pane')}
              fontSize={1}
              id={tabElementId('vision-mobile-request-tab')}
              label={t('query.label')}
              onClick={() => setMobilePane('request')}
              padding={2}
              selected={mobilePane === 'request'}
            />
            <Tab
              aria-controls={tabElementId('vision-mobile-response-pane')}
              fontSize={1}
              id={tabElementId('vision-mobile-response-tab')}
              label={t('result.label')}
              onClick={() => setMobilePane('response')}
              padding={2}
              selected={mobilePane === 'response'}
            />
          </TabList>
        </Flex>
        <Box
          aria-labelledby={tabElementId('vision-mobile-request-tab')}
          className={styles.paneFill}
          flexBasis="0%"
          flexGrow={1}
          hidden={mobilePane !== 'request'}
          id={tabElementId('vision-mobile-request-pane')}
          role="tabpanel"
        >
          {requestPanel}
        </Box>
        <Box
          aria-labelledby={tabElementId('vision-mobile-response-tab')}
          className={styles.paneFill}
          flexBasis="0%"
          flexGrow={1}
          hidden={mobilePane !== 'response'}
          id={tabElementId('vision-mobile-response-pane')}
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
  // pane wins when there is no room for both)
  return (
    <Box {...panelProps} className={cx(styles.splitPaneContainer, panelProps.className)}>
      <ResizableSplit
        key={layout}
        label={t('vision.split.request-response')}
        minSecondarySize={minSize}
        minSize={minSize}
        onChange={(size, snapped) => {
          setSplitSizes((sizes) => ({...sizes, [layout]: size}))
          setSplitSnapped(snapped)
        }}
        onReset={() => {
          setSplitSizes((sizes) => ({...sizes, [layout]: undefined}))
          setSplitSnapped(false)
        }}
        size={splitSizes[layout] ?? defaultSplitSize}
        snapToCenter
        snapped={splitSnapped}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- layout mode, not user-facing text
        split={layout === 'stacked' ? 'horizontal' : 'vertical'}
        testId="vision-split"
      >
        <Box className={styles.paneFill}>{requestPanel}</Box>
        <Box className={styles.paneFill}>{responsePanel}</Box>
      </ResizableSplit>
    </Box>
  )
}

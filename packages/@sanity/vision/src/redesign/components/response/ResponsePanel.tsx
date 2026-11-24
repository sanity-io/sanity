import {Badge, Card, Label} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {type Schema, useSchema} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {QueryErrorDialog} from '../../../components/QueryErrorDialog'
import {ResultView, type ResultViewCopy} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {describeKeypath} from '../../../util/getAtKeypath'
import {canEncodeCsv, getCsvBlobUrl, getJsonBlobUrl} from '../../../util/getBlobUrl'
import {useAiFeatures} from '../../aiFeatures'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {useOneOffSourceMap} from '../../hooks/useOneOffSourceMap'
import {useQueryAgent} from '../../hooks/useQueryAgent'
import {useQueryExplain} from '../../hooks/useQueryExplain'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useScrolledFromTop} from '../../hooks/useScrolledFromTop'
import {type QueryRunnerRef, selectRequestStatus} from '../../store/queryRunnerMachine'
import {
  type QueryRequest,
  type VisionResultView,
  type VisionTab,
  type VisionTabDrawer,
} from '../../store/types'
import {useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {
  selectOpenTabDrawer,
  selectResultView,
  selectSourceMapEnabled,
} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {getAvailableRowFields} from '../../util/documentListFields'
import {canImproveDocumentList, getRowTypes, parseDocumentList} from '../../util/documentListResult'
import {haveSameQuery} from '../../util/queryRequest'
import {fetchSyncTagSourceMap} from '../../util/syncTagLookup'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import {CopyButton} from '../CopyButton'
import {useRequestBottomPanel, useResponseBottomPanel} from '../queryTabLayout'
import * as styles from '../redesign.module.css'
import {usePerspectiveOptionName} from '../request/OptionFields'
import {SplitWithBottomPanel} from '../SplitWithBottomPanel'
import {TabDrawerPortal} from '../TabDrawerPortal'
import {useTabElementId} from '../tabs/queryTabShown'
import {DeltaTab, useDeltaPanel} from './DeltaTab'
import {DocumentListView} from './documentList/DocumentListView'
import {FitDocumentListQuery} from './documentList/FitDocumentListQuery'
import {ExplainTab} from './ExplainTab'
import {HistoryTab} from './HistoryTab'
import {MutateTab, useMutatePanel} from './MutateTab'
import {ResponseMetaTab} from './ResponseMetaTab'
import {ResultActionsMenu} from './ResultActionsMenu'
import {ResultGraph} from './ResultGraph'
import {ResultJson} from './ResultJson'
import {type ResultViewOption, ResultViewMenu} from './ResultViewMenu'
import {SourceMapTab, type SourceMapView} from './SourceMapTab'

const DEFAULT_BOTTOM_PANEL_SIZE = {columns: 220, stacked: 180, mobile: 160}

export interface ResponsePanelProps {
  tab: VisionTab
  runnerRef: QueryRunnerRef
  resolved: ResolvedRequest
  /** What the tab would fetch right now; tells whether the shown result is for the current query */
  request: QueryRequest | null
  /** The tab's params, which Improve query starts from; undefined while they do not parse */
  params: Record<string, unknown> | undefined
  /** Formats a query for the query editor, as Prettify does */
  formatForEditor: (query: string) => Promise<string>
}

export function ResponsePanel(props: ResponsePanelProps) {
  const {tab, runnerRef, resolved, request, params, formatForEditor} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const tabElementId = useTabElementId()
  const resultContentId = tabElementId('vision-result-content')
  const toast = useToast()
  const {state: panelState, setState: setPanelState} = useResponseBottomPanel()

  const status = useSelector(runnerRef, selectRequestStatus)
  const result = useSelector(runnerRef, (snapshot) => snapshot.context.result)
  const settledRequest = useSelector(runnerRef, (snapshot) => snapshot.context.settledRequest)
  const error = useSelector(runnerRef, (snapshot) => snapshot.context.error)
  // The request whose failure is shown: the runner keeps it, while the tab's options (and with
  // them `resolved`) may have moved on while it was in flight, so its error is explained with
  // the API version, perspective and variant it went out with
  const failedRequest = useSelector(runnerRef, (snapshot) =>
    snapshot.matches({request: 'failed'}) ? snapshot.context.request : undefined,
  )
  const failedConfig = failedRequest?.client.config()
  const meta = useSelector(runnerRef, (snapshot) => snapshot.context.meta)
  // While a newer fetch is in flight the shown response keeps its own URL, not the pending one
  const url = useSelector(
    runnerRef,
    (snapshot) => snapshot.context.meta?.url ?? snapshot.context.url,
  )
  const history = useSelector(runnerRef, (snapshot) => snapshot.context.history)
  const hiddenDiffFields = useVisionSelector(
    (snapshot) => snapshot.context.historyDiff.hiddenFields,
  )

  // A response stays on screen while a newer fetch is in flight, and its actions stay with it;
  // a failed fetch or a cleared tab drops `meta` together with the result
  const hasResult = meta !== undefined
  const resultIsCurrent =
    hasResult &&
    settledRequest !== undefined &&
    request !== null &&
    haveSameQuery(settledRequest, request)
  // Document links in the result must point at the dataset it was fetched from, which the tab's
  // options may already have moved away from
  const resultDataset = settledRequest?.client.config().dataset || resolved.dataset
  // Serializing a large result is not free, and automatic refetching brings a new one with every
  // live event, so the files are built when a download is asked for rather than for every
  // response; the CSV button reads the result's shape to know whether there is a file to build
  const getJsonUrl = useCallback(() => getJsonBlobUrl(result), [result])
  const getCsvUrl = useCallback(() => getCsvBlobUrl(result), [result])
  const canExportCsv = hasResult && canEncodeCsv(result)
  const reportCsvUnavailable = useCallback(
    () =>
      toast.push({
        closable: true,
        status: 'warning',
        title: t('result.save-result-as-csv.not-csv-encodable'),
      }),
    [t, toast],
  )

  const resolveSyncTags = useVisionSelector((snapshot) => snapshot.context.response.resolveSyncTags)
  // Looked up with the client the shown result came from: its tags were computed for its dataset,
  // which the tab's options may already have moved away from
  const resultSourceMap = meta?.resultSourceMap
  const syncTagLookup = useMemo(() => {
    if (!resolveSyncTags || !settledRequest) return undefined
    const {client, query, params} = settledRequest
    return {
      client,
      result,
      resultSourceMap,
      // A result that dereferences does not show the documents it read; the source map does
      loadSourceMap: (signal: AbortSignal | undefined) =>
        fetchSyncTagSourceMap(client, query, params, signal),
    }
  }, [resolveSyncTags, result, resultSourceMap, settledRequest])
  const queryExplain = useQueryExplain(request)
  const improveAgent = useQueryAgent({tab, client: resolved.client, formatForEditor})
  const documentListAgent = useQueryAgent({tab, client: resolved.client, formatForEditor})
  const {editQuery: aiEdit} = useAiFeatures()
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const delta = useDeltaPanel()
  const mutate = useMutatePanel()
  const actorRef = useVisionActor()
  // The last view picked in any tab, JSON until one is. The result's shape never picks one.
  const storedResultView = useVisionSelector(selectResultView)
  const parsedDocuments = useMemo(
    () => (hasResult && storedResultView === 'documents' ? parseDocumentList(result) : undefined),
    [hasResult, result, storedResultView],
  )
  const schema = useSchema() as Schema | undefined
  const documentListImprovable = useMemo(() => {
    if (!parsedDocuments) return false
    const available = schema
      ? getAvailableRowFields(schema, getRowTypes(parsedDocuments))
      : undefined
    return canImproveDocumentList(parsedDocuments, available)
  }, [parsedDocuments, schema])
  const settledQuery = settledRequest?.query ?? ''
  // Documents picked for this query shows its guidance when the result is not a document list.
  // Otherwise a remembered Documents shows such a result as JSON and stays remembered.
  const [documentsPickedFor, setDocumentsPickedFor] = useState<string | undefined>(undefined)
  const resultView =
    parsedDocuments?.ok === false && documentsPickedFor !== settledQuery ? 'json' : storedResultView
  const setResultView = useCallback(
    (view: VisionResultView) => {
      setDocumentsPickedFor(view === 'documents' ? settledQuery : undefined)
      actorRef.send({type: 'result.view', view})
    },
    [actorRef, settledQuery],
  )
  // The source map's view is the panel's own, and starts on the tree it always showed
  const [sourceMapView, setSourceMapView] = useState<SourceMapView>('tree')
  const sourceMapViews = useMemo(
    (): ResultViewOption<SourceMapView>[] => [
      {id: 'json', label: t('vision.result.view.json')},
      {id: 'tree', label: t('vision.result.view.tree')},
      {id: 'graph', label: t('vision.result.view.graph')},
      {id: 'documents', label: t('vision.result.view.documents')},
    ],
    [t],
  )
  const sourceMapContentId = tabElementId('vision-source-map-content')
  const sourceMapEnabled = useVisionSelector(selectSourceMapEnabled)
  const oneOffSourceMap = useOneOffSourceMap(request, meta)
  const sourceMap = meta?.resultSourceMap ?? oneOffSourceMap.sourceMap
  const hasSourceMap = sourceMap !== undefined
  const {setState: setRequestPanelState} = useRequestBottomPanel()
  const revealSourceMapOption = useCallback(() => {
    setRequestPanelState((current) => ({...current, activeTabId: 'options', collapsed: false}))
    // The Options tab's fields mount with the render that opens it
    requestAnimationFrame(() => {
      const field = document
        .getElementById(tabElementId('vision-request-options-panel'))
        ?.querySelector<HTMLInputElement>('[data-testid="vision-option-source-map"]')
      if (!field) return
      field.focus({focusVisible: true} as FocusOptions)
      const row = field.closest('label')
      row?.scrollIntoView?.({block: 'nearest'})
      // A focus ring alone is easy to miss after a click elsewhere, so the row flashes once
      row?.animate?.(
        [
          {outline: '2px solid var(--card-focus-ring-color)', outlineOffset: '4px'},
          {outline: '2px solid transparent', outlineOffset: '4px'},
        ],
        {duration: 1600, easing: 'ease-out'},
      )
    })
  }, [setRequestPanelState, tabElementId])
  const resultViews = useMemo((): ResultViewOption<VisionResultView>[] => {
    const views: ResultViewOption<VisionResultView>[] = [
      {id: 'json', label: t('vision.result.view.json')},
      {id: 'tree', label: t('vision.result.view.tree')},
      {id: 'graph', label: t('vision.result.view.graph')},
    ]
    // Documents is a choice whenever a result is showing, including one the list cannot open
    if (hasResult) views.push({id: 'documents', label: t('vision.result.view.documents')})
    return views
  }, [hasResult, t])
  const resultFills =
    hasResult &&
    ((resultView === 'documents' && parsedDocuments !== undefined) ||
      resultView === 'json' ||
      resultView === 'graph')
  const {scrolled: resultScrolled, setScroller: setResultScroller} = useScrolledFromTop()
  const copyToClipboard = useCopyToClipboard()
  // The Copy button confirms the copy itself, so no toast
  const copyResult = useCallback(
    () => copyToClipboard(JSON.stringify(result, null, 2)),
    [copyToClipboard, result],
  )
  // Text is copied as it is (an ID, a slug) and everything else as indented JSON
  const copyValue = useMemo(
    (): ResultViewCopy => ({
      label: t('vision.result.copy-value'),
      onCopy: (value, keypath) =>
        copyToClipboard(
          typeof value === 'string' ? value : JSON.stringify(value, null, 2),
          keypath
            ? t('vision.result.copied-value', {path: describeKeypath(keypath)})
            : t('vision.result.copied'),
        ),
    }),
    [copyToClipboard, t],
  )

  const panelTabs = useMemo(
    (): CollapsiblePanelTab[] => [
      {
        id: 'response',
        label: t('vision.panel.response'),
        content: (
          <ResponseMetaTab
            meta={meta}
            perspectiveName={perspectiveName}
            resolved={resolved}
            syncTagLookup={syncTagLookup}
            url={url}
          />
        ),
      },
      {
        id: 'history',
        label:
          history.length > 0 ? (
            <Flex alignItems="center" as="span" gap={2}>
              {t('vision.panel.history')}
              <Badge fontSize={0}>{history.length}</Badge>
            </Flex>
          ) : (
            t('vision.panel.history')
          ),
        content: <HistoryTab hiddenFields={hiddenDiffFields} history={history} />,
      },
      {
        id: 'explain',
        label: t('vision.panel.explain'),
        content: (
          <ExplainTab
            canExplain={request !== null}
            client={resolved.client}
            explanation={queryExplain.explanation}
            improveAgent={improveAgent}
            onExplain={() => void queryExplain.explain()}
            onShowPlan={queryExplain.showPlan}
            params={params}
            plan={queryExplain.plan}
            tab={tab}
          />
        ),
      },
      {
        id: 'source-map',
        label: t('vision.panel.source-map'),
        fill: hasSourceMap && sourceMapView !== 'tree',
        // Picks the view, above it; there is nothing to pick while there is no source map
        toolbar: hasSourceMap ? (
          <Flex alignItems="center" data-testid="vision-source-map-toolbar" gap={2} padding={2}>
            <ResultViewMenu
              controls={sourceMapContentId}
              id={tabElementId('vision-source-map-view-menu')}
              onChange={setSourceMapView}
              placement="bottom-start"
              testId="vision-source-map-view"
              value={sourceMapView}
              views={sourceMapViews}
            />
            {meta?.resultSourceMap === undefined && (
              <Text data-testid="vision-source-map-one-off" muted size={1} trim={true}>
                {t('vision.source-map.one-off')}
              </Text>
            )}
          </Flex>
        ) : undefined,
        content: (
          <SourceMapTab
            copy={copyValue}
            dataset={resultDataset}
            id={sourceMapContentId}
            onFetch={request ? oneOffSourceMap.fetch : undefined}
            onRevealOption={revealSourceMapOption}
            oneOff={oneOffSourceMap}
            sourceMap={sourceMap}
            view={sourceMapView}
          />
        ),
      },
    ],
    [
      copyValue,
      hasSourceMap,
      hiddenDiffFields,
      history,
      improveAgent,
      meta,
      oneOffSourceMap,
      params,
      perspectiveName,
      queryExplain,
      request,
      resolved,
      resultDataset,
      revealSourceMapOption,
      sourceMap,
      sourceMapContentId,
      sourceMapView,
      sourceMapViews,
      syncTagLookup,
      t,
      tab,
      tabElementId,
      url,
    ],
  )
  // The Content Source Map tab is hidden while its features are switched off, and the panel
  // shows Result if it was the open one
  const shownPanelTabs = sourceMapEnabled
    ? panelTabs
    : panelTabs.filter((panelTab) => panelTab.id !== 'source-map')
  // The Content Source Map tab may be the open one when its features are switched off
  const shownPanelState =
    !sourceMapEnabled && panelState.activeTabId === 'source-map'
      ? {...panelState, activeTabId: 'response'}
      : panelState

  // The tab's tools open in the sidebar's drawer
  const tabDrawer = useVisionSelector(selectOpenTabDrawer)
  const renderTabDrawer = (drawer: VisionTabDrawer): ReactNode => {
    switch (drawer) {
      case 'delta':
        return <DeltaTab delta={delta} request={request} />
      case 'mutate':
        return (
          <MutateTab
            canRequest={resolved.isValidApiVersion}
            client={resolved.client}
            dataset={resolved.dataset}
            hiddenFields={hiddenDiffFields}
            mutate={mutate}
            result={hasResult ? result : undefined}
          />
        )
      default: {
        const unknownDrawer: never = drawer
        return String(unknownDrawer)
      }
    }
  }

  return (
    <>
      {tabDrawer && <TabDrawerPortal>{renderTabDrawer(tabDrawer)}</TabDrawerPortal>}
      <SplitWithBottomPanel
        defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
        fitOnTabDoubleClick
        id="vision-response"
        onStateChange={setPanelState}
        state={shownPanelState}
        tabs={shownPanelTabs}
        testId="vision-response-panel"
      >
        <Card
          className={styles.resultContainer}
          // The shown result stays while a newer fetch is in flight, and dims if that takes long
          data-refreshing={hasResult && status === 'fetching'}
          data-testid="vision-result"
          display="flex"
          tone={status === 'failed' ? 'critical' : 'default'}
        >
          <div
            className={cx(styles.paneToolbar, styles.paneToolbarMain)}
            data-scrolled={resultScrolled}
            data-testid="vision-result-toolbar"
          >
            <Label className={styles.paneToolbarLabel} muted size={1}>
              {t('result.label')}
            </Label>
            <Flex alignItems="center" data-testid="vision-result-actions" gap={1}>
              {/* First: the row is anchored on the right, so "Copied" grows to the left */}
              <CopyButton disabled={!hasResult} onCopy={copyResult} testId="vision-copy-result" />
              <ResultViewMenu
                controls={resultContentId}
                id={tabElementId('vision-result-view-menu')}
                onChange={setResultView}
                value={resultView}
                views={resultViews}
              />
              <ResultActionsMenu
                csvUnavailableHint={
                  hasResult && !canExportCsv
                    ? t('result.save-result-as-csv.not-csv-encodable')
                    : undefined
                }
                getCsvUrl={canExportCsv ? getCsvUrl : undefined}
                getJsonUrl={hasResult ? getJsonUrl : undefined}
                hasResult={hasResult}
                onCsvUnavailable={reportCsvUnavailable}
                result={result}
                resultIsCurrent={resultIsCurrent}
                tab={tab}
              />
            </Flex>
          </div>
          <div
            className={styles.paneScroll}
            // JSON, Graph and Documents scroll or pan inside their own box
            data-fill={resultFills ? '' : undefined}
            // Each view starts at its top
            key={resultFills ? resultView : 'scroll'}
            ref={setResultScroller}
          >
            {hasResult && parsedDocuments && resultView === 'documents' ? (
              <DocumentListView
                className={styles.resultView}
                datasetName={resultDataset}
                id={resultContentId}
                parsed={parsedDocuments}
                action={
                  aiEdit &&
                  (documentListAgent.status.type === 'running' ||
                    (resultIsCurrent && documentListImprovable)) ? (
                    <FitDocumentListQuery
                      agent={documentListAgent}
                      client={resolved.client}
                      params={params}
                      parsed={parsedDocuments}
                      result={result}
                      tab={tab}
                    />
                  ) : undefined
                }
              />
            ) : hasResult && resultView === 'json' ? (
              <ResultJson className={styles.resultView} id={resultContentId} value={result} />
            ) : hasResult && resultView === 'graph' ? (
              <ResultGraph
                className={styles.resultView}
                copy={copyValue}
                id={resultContentId}
                value={result}
              />
            ) : (
              <Box
                className={hasResult && resultView === 'tree' ? styles.treeContent : undefined}
                id={resultContentId}
                padding={3}
              >
                {status === 'fetching' && (
                  <Box className={styles.resultSpinner} marginTop={3}>
                    <DelayedSpinner />
                  </Box>
                )}
                {status === 'failed' && error && (
                  <div className={styles.resultEnter}>
                    <QueryErrorDialog
                      apiVersion={failedConfig?.apiVersion ?? resolved.apiVersion}
                      error={error}
                      perspective={failedConfig ? failedConfig.perspective : resolved.perspective}
                      variant={
                        failedConfig
                          ? typeof failedConfig.variant === 'string'
                            ? failedConfig.variant
                            : undefined
                          : resolved.variant
                      }
                    />
                  </div>
                )}
                {hasResult && resultView === 'tree' && (
                  <div className={styles.resultView}>
                    <ResultView copy={copyValue} data={result} datasetName={resultDataset} />
                  </div>
                )}
                {status === 'idle' && (
                  <Text muted size={1} as="div" trim={true}>
                    {t('vision.result.empty')}
                  </Text>
                )}
              </Box>
            )}
          </div>
        </Card>
      </SplitWithBottomPanel>
    </>
  )
}

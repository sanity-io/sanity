import {Badge, Card, Label} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {QueryErrorDialog} from '../../../components/QueryErrorDialog'
import {ResultView, type ResultViewCopy} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {describeKeypath} from '../../../util/getAtKeypath'
import {canEncodeCsv, getCsvBlobUrl, getJsonBlobUrl} from '../../../util/getBlobUrl'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {useQueryExplain} from '../../hooks/useQueryExplain'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRunnerRef, selectRequestStatus} from '../../store/queryRunnerMachine'
import {
  type QueryRequest,
  type VisionResultView,
  type VisionTab,
  type VisionTabDrawer,
} from '../../store/types'
import {useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {selectOpenTabDrawer, selectResultView} from '../../store/visionMachine'
import {parseDocumentList} from '../../util/documentListResult'
import {haveSameQuery} from '../../util/queryRequest'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import {CopyButton} from '../CopyButton'
import {useResponseBottomPanel} from '../queryTabLayout'
import * as styles from '../redesign.module.css'
import {usePerspectiveOptionName} from '../request/OptionFields'
import {SplitWithBottomPanel} from '../SplitWithBottomPanel'
import {TabDrawerPortal} from '../TabDrawerPortal'
import {useTabElementId} from '../tabs/queryTabShown'
import {DeltaTab, useDeltaPanel} from './DeltaTab'
import {DocumentListView} from './documentList/DocumentListView'
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

/**
 * The query a tab left the document list for. Switching tabs hides this panel in an `<Activity>`
 * boundary, which keeps its state, and the map keeps the choice if the panel remounts.
 */
const dismissedDocumentListQuery = new Map<string, string>()

export interface ResponsePanelProps {
  tab: VisionTab
  runnerRef: QueryRunnerRef
  resolved: ResolvedRequest
  /** What the tab would fetch right now; tells whether the shown result is for the current query */
  request: QueryRequest | null
  /** Mutations were applied from the Mutate panel, and the result may have changed */
  onMutationsApplied: () => void
}

export function ResponsePanel(props: ResponsePanelProps) {
  const {tab, runnerRef, resolved, request, onMutationsApplied} = props
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
  const settledClient = settledRequest?.client
  const syncTagLookup = useMemo(
    () => (resolveSyncTags && settledClient ? {client: settledClient, result} : undefined),
    [resolveSyncTags, result, settledClient],
  )
  const queryExplain = useQueryExplain(request)
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const delta = useDeltaPanel()
  const mutate = useMutatePanel()
  const actorRef = useVisionActor()
  const storedResultView = useVisionSelector(selectResultView)
  // A non-empty array of `{_id, _type?, title?, subtitle?, media?}` opens as documents. Picking another
  // view keeps that view for the query. A result that does not fit stays on the stored view, and
  // Documents is still there so the guidance can be opened.
  const parsedDocuments = useMemo(
    () => (hasResult ? parseDocumentList(result) : undefined),
    [hasResult, result],
  )
  const settledQuery = settledRequest?.query ?? ''
  const [documentsDismissedFor, setDocumentsDismissedFor] = useState<string | undefined>(() =>
    dismissedDocumentListQuery.get(tab.id),
  )
  const [forcedDocumentsQuery, setForcedDocumentsQuery] = useState<string | undefined>(undefined)
  const opensDocuments = parsedDocuments?.ok === true && parsedDocuments.documents.length > 0
  const autoOpensDocuments = opensDocuments && documentsDismissedFor !== settledQuery
  // Once Documents is open for the query it stays open, also when a refetch returns `[]`
  if (autoOpensDocuments && forcedDocumentsQuery !== settledQuery) {
    setForcedDocumentsQuery(settledQuery)
  }
  const showDocuments =
    parsedDocuments !== undefined && (autoOpensDocuments || forcedDocumentsQuery === settledQuery)
  const resultView = showDocuments ? 'documents' : storedResultView
  const setResultView = useCallback(
    (view: VisionResultView | 'documents') => {
      if (view === 'documents') {
        dismissedDocumentListQuery.delete(tab.id)
        setDocumentsDismissedFor(undefined)
        setForcedDocumentsQuery(settledQuery)
        return
      }
      dismissedDocumentListQuery.set(tab.id, settledQuery)
      setDocumentsDismissedFor(settledQuery)
      setForcedDocumentsQuery(undefined)
      actorRef.send({type: 'result.view', view})
    },
    [actorRef, settledQuery, tab.id],
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
  const hasSourceMap = meta?.resultSourceMap !== undefined
  const resultViews = useMemo((): ResultViewOption<VisionResultView | 'documents'>[] => {
    const views: ResultViewOption<VisionResultView | 'documents'>[] = [
      {id: 'json', label: t('vision.result.view.json')},
      {id: 'tree', label: t('vision.result.view.tree')},
      {id: 'graph', label: t('vision.result.view.graph')},
    ]
    // Documents is a choice whenever a result is showing, including one the list cannot open
    if (hasResult) views.push({id: 'documents', label: t('vision.result.view.documents')})
    return views
  }, [hasResult, t])
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
        void copyToClipboard(
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
            onExplain={() => void queryExplain.explain()}
            onShowPlan={queryExplain.showPlan}
            plan={queryExplain.plan}
          />
        ),
      },
      {
        id: 'source-map',
        label: t('vision.panel.source-map'),
        actions: hasSourceMap ? (
          <ResultViewMenu
            controls={sourceMapContentId}
            id={tabElementId('vision-source-map-view-menu')}
            onChange={setSourceMapView}
            testId="vision-source-map-view"
            value={sourceMapView}
            views={sourceMapViews}
          />
        ) : undefined,
        fill: hasSourceMap && sourceMapView !== 'tree',
        content: (
          <SourceMapTab
            copy={copyValue}
            dataset={resultDataset}
            id={sourceMapContentId}
            meta={meta}
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
      meta,
      perspectiveName,
      queryExplain,
      request,
      resolved,
      resultDataset,
      sourceMapContentId,
      sourceMapView,
      sourceMapViews,
      syncTagLookup,
      t,
      tabElementId,
      url,
    ],
  )

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
            onApplied={onMutationsApplied}
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
        state={panelState}
        tabs={panelTabs}
        testId="vision-response-panel"
      >
        <Card
          className={styles.resultContainer}
          // The shown result stays while a newer fetch is in flight, and dims if that takes long
          data-refreshing={hasResult && status === 'fetching'}
          data-testid="vision-result"
          tone={status === 'failed' ? 'critical' : 'default'}
        >
          <Box className={styles.paneLabel}>
            <Flex alignItems="center" gap={2}>
              <Label muted size={1}>
                {t('result.label')}
              </Label>
              <Flex
                alignItems="center"
                className={styles.labelActions}
                data-testid="vision-result-actions"
                gap={1}
              >
                <ResultViewMenu
                  controls={resultContentId}
                  id={tabElementId('vision-result-view-menu')}
                  onChange={setResultView}
                  value={resultView}
                  views={resultViews}
                />
                <CopyButton disabled={!hasResult} onCopy={copyResult} testId="vision-copy-result" />
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
            </Flex>
          </Box>
          {hasResult && parsedDocuments && resultView === 'documents' ? (
            <DocumentListView
              className={styles.resultView}
              datasetName={resultDataset}
              id={resultContentId}
              parsed={parsedDocuments}
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
            <Box id={resultContentId} padding={3} paddingTop={5}>
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
        </Card>
      </SplitWithBottomPanel>
    </>
  )
}

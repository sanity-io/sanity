import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentSheetIcon} from '@sanity/icons/DocumentSheet'
import {JsonIcon} from '@sanity/icons/Json'
import {Badge, Button, Card, Label, Tab, TabList, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {type ReactNode, useCallback, useEffect, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

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
  type VisionSavedFunction,
  type VisionTab,
  type VisionTabDrawer,
} from '../../store/types'
import {useSidebarBadges, useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {
  selectFunctionLibrary,
  selectOpenTabDrawer,
  selectResultView,
} from '../../store/visionMachine'
import {parseGroq, readQueryFunctions, type TextRange} from '../../util/groqFunctions'
import {type QueryLintFinding} from '../../util/groqLint'
import {haveSameQuery} from '../../util/queryRequest'
import {ActionRail} from '../ActionRail'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import * as styles from '../redesign.module.css'
import {usePerspectiveOptionName} from '../request/OptionFields'
import {SplitWithBottomPanel} from '../SplitWithBottomPanel'
import {TabDrawerPortal} from '../TabDrawerPortal'
import {DeltaTab, useDeltaPanel} from './DeltaTab'
import {DownloadButton} from './DownloadButton'
import {ExplainTab} from './ExplainTab'
import {FunctionsTab, type QueryEdit} from './FunctionsTab'
import {HistoryTab} from './HistoryTab'
import {LintTab} from './LintTab'
import {MutateTab, useMutatePanel} from './MutateTab'
import {NetworkTab} from './NetworkTab'
import {ResponseMetaTab} from './ResponseMetaTab'
import {ResultActionsMenu} from './ResultActionsMenu'
import {ResultGraph} from './ResultGraph'
import {ResultJson} from './ResultJson'
import {SourceMapTab} from './SourceMapTab'

const DEFAULT_BOTTOM_PANEL_SIZE = {columns: 220, stacked: 180, mobile: 160}

export interface ResponsePanelProps {
  tab: VisionTab
  runnerRef: QueryRunnerRef
  resolved: ResolvedRequest
  /** What the tab would fetch right now; tells whether the shown result is for the current query */
  request: QueryRequest | null
  /** The query editor's lint diagnostics, listed in the Lint panel */
  lintFindings: QueryLintFinding[]
  /** Shows part of the query (a lint finding, a function declaration) in the query editor */
  onRevealRange: (range: TextRange) => void
  /** Changes the query through its editor */
  onEditQuery: (edit: QueryEdit) => void
  /** Mutations were applied from the Mutate panel, and the result may have changed */
  onMutationsApplied: () => void
}

export function ResponsePanel(props: ResponsePanelProps) {
  const {
    tab,
    runnerRef,
    resolved,
    request,
    lintFindings,
    onRevealRange,
    onEditQuery,
    onMutationsApplied,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()

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
  const isLive = useSelector(runnerRef, (snapshot) => snapshot.matches({live: 'on'}))

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

  const queryExplain = useQueryExplain(request)
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const delta = useDeltaPanel()
  const mutate = useMutatePanel()
  const actorRef = useVisionActor()
  const resultView = useVisionSelector(selectResultView)
  const functionLibrary = useVisionSelector(selectFunctionLibrary)
  const saveFunction = useCallback(
    (fn: VisionSavedFunction) => actorRef.send({type: 'functions.save', fn}),
    [actorRef],
  )
  const removeFunction = useCallback(
    (id: string) => actorRef.send({type: 'functions.remove', id}),
    [actorRef],
  )
  // A declaration without a namespace does not parse for the API; lint says so
  const declaredFunctions = useMemo(
    () =>
      readQueryFunctions(parseGroq(tab.query), tab.query).declarations.filter(
        (declaration) => declaration.namespace !== undefined,
      ),
    [tab.query],
  )
  const setResultView = useCallback(
    (view: VisionResultView) => actorRef.send({type: 'result.view', view}),
    [actorRef],
  )
  const copyToClipboard = useCopyToClipboard()
  const copyResult = useCallback(
    () => void copyToClipboard(JSON.stringify(result, null, 2), t('vision.result.copied')),
    [copyToClipboard, result, t],
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
        content: <ResponseMetaTab meta={meta} url={url} />,
      },
      {
        id: 'network',
        label: t('vision.panel.network'),
        content: <NetworkTab meta={meta} perspectiveName={perspectiveName} resolved={resolved} />,
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
        content: <SourceMapTab dataset={resultDataset} meta={meta} />,
      },
    ],
    [
      hiddenDiffFields,
      history,
      meta,
      perspectiveName,
      queryExplain,
      request,
      resolved,
      resultDataset,
      t,
      url,
    ],
  )

  // The tab's tools open in the sidebar's drawer
  const tabDrawer = useVisionSelector(selectOpenTabDrawer)
  const renderTabDrawer = (drawer: VisionTabDrawer): ReactNode => {
    switch (drawer) {
      case 'lint':
        return <LintTab findings={lintFindings} onReveal={onRevealRange} />
      case 'functions':
        return (
          <FunctionsTab
            declarations={declaredFunctions}
            library={functionLibrary}
            onEdit={onEditQuery}
            onRemove={removeFunction}
            onReveal={onRevealRange}
            onSave={saveFunction}
            query={tab.query}
          />
        )
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

  // The sidebar shows how many lint findings and declared functions the tab has
  const sidebarBadges = useSidebarBadges()
  const lintCount = lintFindings.length
  const lintTone = lintFindings.some((finding) => finding.severity === 'error')
    ? 'critical'
    : 'caution'
  const functionCount = declaredFunctions.length
  useEffect(() => {
    sidebarBadges.set('lint', lintCount > 0 ? {count: lintCount, tone: lintTone} : undefined)
    sidebarBadges.set(
      'functions',
      functionCount > 0 ? {count: functionCount, tone: 'default'} : undefined,
    )
  }, [functionCount, lintCount, lintTone, sidebarBadges])
  useEffect(
    () => () => {
      sidebarBadges.set('lint', undefined)
      sidebarBadges.set('functions', undefined)
    },
    [sidebarBadges],
  )

  return (
    <>
      {tabDrawer && <TabDrawerPortal>{renderTabDrawer(tabDrawer)}</TabDrawerPortal>}
      <SplitWithBottomPanel
        defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
        footer={
          <ActionRail testId="vision-result-actions">
            <DownloadButton
              download="query-result.json"
              getBlobUrl={hasResult ? getJsonUrl : undefined}
              icon={JsonIcon}
              label={t('vision.result.export-json')}
              testId="vision-export-json"
            />
            <DownloadButton
              download="query-result.csv"
              getBlobUrl={canExportCsv ? getCsvUrl : undefined}
              icon={DocumentSheetIcon}
              label={t('vision.result.export-csv')}
              onUnavailable={reportCsvUnavailable}
              testId="vision-export-csv"
              tooltip={
                hasResult && !canExportCsv
                  ? t('result.save-result-as-csv.not-csv-encodable')
                  : undefined
              }
            />
            <ResultActionsMenu
              hasResult={hasResult}
              result={result}
              resultIsCurrent={resultIsCurrent}
              tab={tab}
            />
          </ActionRail>
        }
        id="vision-response"
        tabs={panelTabs}
        testId="vision-response-panel"
      >
        <Card
          className={styles.resultContainer}
          data-testid="vision-result"
          tone={status === 'failed' ? 'critical' : 'default'}
        >
          <Box className={styles.resultLabel}>
            <Flex alignItems="center" gap={2}>
              <Label muted size={1}>
                {t('result.label')}
              </Label>
              {isLive && (
                <Badge fontSize={0} tone="positive">
                  {t('vision.live.active')}
                </Badge>
              )}
              <Box flexBasis="0%" flexGrow={1} />
              {hasResult && (
                <Flex alignItems="center" className={styles.labelActions} gap={1}>
                  <TabList aria-label={t('vision.result.view.label')} gap={1}>
                    <Tab
                      aria-controls="vision-result-content"
                      fontSize={1}
                      id="vision-result-view-tree"
                      label={t('vision.result.view.tree')}
                      onClick={() => setResultView('tree')}
                      padding={2}
                      selected={resultView === 'tree'}
                    />
                    <Tab
                      aria-controls="vision-result-content"
                      fontSize={1}
                      id="vision-result-view-json"
                      label={t('vision.result.view.json')}
                      onClick={() => setResultView('json')}
                      padding={2}
                      selected={resultView === 'json'}
                    />
                    <Tab
                      aria-controls="vision-result-content"
                      fontSize={1}
                      id="vision-result-view-graph"
                      label={t('vision.result.view.graph')}
                      onClick={() => setResultView('graph')}
                      padding={2}
                      selected={resultView === 'graph'}
                    />
                  </TabList>
                  <Tooltip
                    animate
                    content={<Text size={1}>{t('vision.result.copy')}</Text>}
                    placement="bottom"
                    portal
                  >
                    <Button
                      aria-label={t('vision.result.copy')}
                      data-testid="vision-copy-result"
                      fontSize={1}
                      icon={CopyIcon}
                      mode="bleed"
                      onClick={copyResult}
                      padding={2}
                    />
                  </Tooltip>
                </Flex>
              )}
            </Flex>
          </Box>
          {hasResult && resultView === 'json' ? (
            <ResultJson id="vision-result-content" value={result} />
          ) : hasResult && resultView === 'graph' ? (
            <ResultGraph copy={copyValue} id="vision-result-content" value={result} />
          ) : (
            <Box id="vision-result-content" padding={3} paddingTop={5}>
              {status === 'fetching' && (
                <Box marginTop={3}>
                  <DelayedSpinner />
                </Box>
              )}
              {status === 'failed' && error && (
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
              )}
              {hasResult && resultView === 'tree' && (
                <ResultView copy={copyValue} data={result} datasetName={resultDataset} />
              )}
              {status === 'idle' && (
                <Text muted size={1}>
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

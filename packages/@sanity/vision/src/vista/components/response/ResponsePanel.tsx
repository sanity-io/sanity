import {DocumentSheetIcon} from '@sanity/icons/DocumentSheet'
import {JsonIcon} from '@sanity/icons/Json'
import {Badge, Card, Label, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {QueryErrorDialog} from '../../../components/QueryErrorDialog'
import {ResultView} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {getCsvBlobUrl, getJsonBlobUrl} from '../../../util/getBlobUrl'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRunnerRef, selectRequestStatus} from '../../store/queryRunnerMachine'
import {type QueryRequest, type VistaTab} from '../../store/types'
import {type QueryLintFinding} from '../../util/groqLint'
import {haveSameQuery} from '../../util/queryRequest'
import {ActionRail} from '../ActionRail'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import {SplitWithBottomPanel} from '../SplitWithBottomPanel'
import {resultContainer, resultLabel} from '../vista.css'
import {DownloadButton} from './DownloadButton'
import {HistoryTab} from './HistoryTab'
import {LintTab} from './LintTab'
import {ResponseMetaTab} from './ResponseMetaTab'
import {ResultActionsMenu} from './ResultActionsMenu'
import {SourceMapTab} from './SourceMapTab'

const DEFAULT_BOTTOM_PANEL_SIZE = {columns: 220, stacked: 180, mobile: 160}

export interface ResponsePanelProps {
  tab: VistaTab
  runnerRef: QueryRunnerRef
  resolved: ResolvedRequest
  /** What the tab would fetch right now; tells whether the shown result is for the current query */
  request: QueryRequest | null
  /** The query editor's lint diagnostics, listed in the Lint panel */
  lintFindings: QueryLintFinding[]
  /** Shows a finding in the query editor */
  onRevealLintFinding: (finding: QueryLintFinding) => void
}

export function ResponsePanel(props: ResponsePanelProps) {
  const {tab, runnerRef, resolved, request, lintFindings, onRevealLintFinding} = props
  const {t} = useTranslation(visionLocaleNamespace)

  const status = useSelector(runnerRef, selectRequestStatus)
  const result = useSelector(runnerRef, (snapshot) => snapshot.context.result)
  const settledRequest = useSelector(runnerRef, (snapshot) => snapshot.context.settledRequest)
  const error = useSelector(runnerRef, (snapshot) => snapshot.context.error)
  const meta = useSelector(runnerRef, (snapshot) => snapshot.context.meta)
  // While a newer fetch is in flight the shown response keeps its own URL, not the pending one
  const url = useSelector(
    runnerRef,
    (snapshot) => snapshot.context.meta?.url ?? snapshot.context.url,
  )
  const history = useSelector(runnerRef, (snapshot) => snapshot.context.history)
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
  // Serializing a large result is not free even when the helpers then reuse their blob, and this
  // panel re-renders with every keystroke in the editors
  const jsonUrl = useMemo(
    () => (hasResult ? getJsonBlobUrl(result) : undefined),
    [hasResult, result],
  )
  const csvUrl = useMemo(() => (hasResult ? getCsvBlobUrl(result) : undefined), [hasResult, result])

  const panelTabs = useMemo(
    (): CollapsiblePanelTab[] => [
      {
        id: 'response',
        label: t('vista.panel.response'),
        content: <ResponseMetaTab meta={meta} url={url} />,
      },
      {
        id: 'lint',
        label:
          lintFindings.length > 0 ? (
            <Flex alignItems="center" as="span" gap={2}>
              {t('vista.panel.lint')}
              <Badge
                fontSize={0}
                tone={
                  lintFindings.some((finding) => finding.severity === 'error')
                    ? 'critical'
                    : 'caution'
                }
              >
                {lintFindings.length}
              </Badge>
            </Flex>
          ) : (
            t('vista.panel.lint')
          ),
        content: <LintTab findings={lintFindings} onReveal={onRevealLintFinding} />,
      },
      {
        id: 'source-map',
        label: t('vista.panel.source-map'),
        content: <SourceMapTab dataset={resultDataset} meta={meta} />,
      },
      {
        id: 'history',
        label:
          history.length > 0 ? (
            <Flex alignItems="center" as="span" gap={2}>
              {t('vista.panel.history')}
              <Badge fontSize={0}>{history.length}</Badge>
            </Flex>
          ) : (
            t('vista.panel.history')
          ),
        content: <HistoryTab history={history} />,
      },
    ],
    [history, lintFindings, meta, onRevealLintFinding, resultDataset, t, url],
  )

  return (
    <SplitWithBottomPanel
      defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
      id="vista-response"
      tabs={panelTabs}
      testId="vista-response-panel"
    >
      <Card
        className={resultContainer}
        data-testid="vista-result"
        tone={status === 'failed' ? 'critical' : 'default'}
      >
        <Box className={resultLabel}>
          <Flex alignItems="center" gap={2}>
            <Label muted size={1}>
              {t('result.label')}
            </Label>
            {isLive && (
              <Badge fontSize={0} tone="positive">
                {t('vista.live.active')}
              </Badge>
            )}
          </Flex>
        </Box>
        <Box padding={3} paddingTop={5}>
          {status === 'fetching' && (
            <Box marginTop={3}>
              <DelayedSpinner />
            </Box>
          )}
          {status === 'failed' && error && (
            <QueryErrorDialog
              apiVersion={resolved.apiVersion}
              error={error}
              perspective={resolved.perspective}
              variant={resolved.variant}
            />
          )}
          {hasResult && <ResultView data={result} datasetName={resultDataset} />}
          {status === 'idle' && (
            <Text muted size={1}>
              {t('vista.result.empty')}
            </Text>
          )}
        </Box>
      </Card>
      <ActionRail testId="vista-result-actions">
        <DownloadButton
          download="query-result.json"
          href={jsonUrl}
          icon={JsonIcon}
          label={t('vista.result.export-json')}
          testId="vista-export-json"
        />
        <DownloadButton
          download="query-result.csv"
          href={csvUrl}
          icon={DocumentSheetIcon}
          label={t('vista.result.export-csv')}
          testId="vista-export-csv"
          tooltip={
            hasResult && !csvUrl ? t('result.save-result-as-csv.not-csv-encodable') : undefined
          }
        />
        <ResultActionsMenu
          hasResult={hasResult}
          result={result}
          resultIsCurrent={resultIsCurrent}
          tab={tab}
        />
      </ActionRail>
    </SplitWithBottomPanel>
  )
}

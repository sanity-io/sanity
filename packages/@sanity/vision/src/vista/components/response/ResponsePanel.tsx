import {SplitPane} from '@rexxars/react-split-pane'
import {DocumentSheetIcon} from '@sanity/icons/DocumentSheet'
import {JsonIcon} from '@sanity/icons/Json'
import {Badge, Button, Card, Label, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {QueryErrorDialog} from '../../../components/QueryErrorDialog'
import {ResultView} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {getCsvBlobUrl, getJsonBlobUrl} from '../../../util/getBlobUrl'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRunnerRef} from '../../store/queryRunnerMachine'
import {type VistaTab} from '../../store/types'
import {ActionRail} from '../ActionRail'
import {CollapsiblePanel, PANEL_HEADER_HEIGHT} from '../CollapsiblePanel'
import {editorLabel, paneFill, resultContainer, splitPaneContainer} from '../vista.css'
import {HistoryTab} from './HistoryTab'
import {ResponseMetaTab} from './ResponseMetaTab'
import {ResultActionsMenu} from './ResultActionsMenu'
import {SourceMapTab} from './SourceMapTab'

const DEFAULT_BOTTOM_PANEL_SIZE = 220

export interface ResponsePanelProps {
  tab: VistaTab
  runnerRef: QueryRunnerRef
  resolved: ResolvedRequest
}

export function ResponsePanel({tab, runnerRef, resolved}: ResponsePanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const [activePanelTab, setActivePanelTab] = useState('response')
  const [collapsed, setCollapsed] = useState(false)
  const [bottomSize, setBottomSize] = useState(DEFAULT_BOTTOM_PANEL_SIZE)

  const status = useSelector(runnerRef, (snapshot) =>
    snapshot.matches({request: 'fetching'})
      ? 'fetching'
      : snapshot.matches({request: 'failed'})
        ? 'failed'
        : snapshot.matches({request: 'settled'})
          ? 'settled'
          : 'idle',
  )
  const result = useSelector(runnerRef, (snapshot) => snapshot.context.result)
  const error = useSelector(runnerRef, (snapshot) => snapshot.context.error)
  const meta = useSelector(runnerRef, (snapshot) => snapshot.context.meta)
  const url = useSelector(runnerRef, (snapshot) => snapshot.context.url)
  const history = useSelector(runnerRef, (snapshot) => snapshot.context.history)
  const isLive = useSelector(runnerRef, (snapshot) => snapshot.matches({live: 'on'}))

  const hasResult = status === 'settled' && meta !== undefined
  const jsonUrl = hasResult ? getJsonBlobUrl(result) : undefined
  const csvUrl = hasResult ? getCsvBlobUrl(result) : undefined

  const panelTabs = useMemo(
    () => [
      {
        id: 'response',
        label: t('vista.panel.response'),
        content: <ResponseMetaTab meta={meta} url={url} />,
      },
      {
        id: 'source-map',
        label: t('vista.panel.source-map'),
        content: <SourceMapTab dataset={tab.options.dataset} meta={meta} />,
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
    [history, meta, t, tab.options.dataset, url],
  )

  return (
    <Flex data-testid="vista-response-panel" flexDirection="column" height="100%">
      <Box className={splitPaneContainer}>
        <SplitPane
          allowResize={!collapsed}
          maxSize={-120}
          minSize={PANEL_HEADER_HEIGHT}
          onChange={(size: number) => setBottomSize(size)}
          primary="second"
          size={collapsed ? PANEL_HEADER_HEIGHT : bottomSize}
          split="horizontal"
        >
          <Flex className={paneFill}>
            <Card
              className={resultContainer}
              data-testid="vista-result"
              tone={status === 'failed' ? 'critical' : 'default'}
            >
              <Box className={editorLabel}>
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
                {(status === 'settled' || (status === 'fetching' && meta)) && (
                  <ResultView data={result} datasetName={tab.options.dataset} />
                )}
                {status === 'idle' && (
                  <Text muted size={1}>
                    {t('vista.result.empty')}
                  </Text>
                )}
              </Box>
            </Card>
            <ActionRail testId="vista-result-actions">
              <Tooltip
                content={<Text size={1}>{t('vista.result.export-json')}</Text>}
                placement="left"
                portal
              >
                {jsonUrl ? (
                  <Button
                    aria-label={t('vista.result.export-json')}
                    as="a"
                    data-testid="vista-export-json"
                    download="query-result.json"
                    href={jsonUrl}
                    icon={JsonIcon}
                    mode="bleed"
                    padding={2}
                  />
                ) : (
                  <Button
                    aria-label={t('vista.result.export-json')}
                    data-testid="vista-export-json"
                    disabled
                    icon={JsonIcon}
                    mode="bleed"
                    padding={2}
                  />
                )}
              </Tooltip>
              <Tooltip
                content={
                  <Text size={1}>
                    {hasResult && !csvUrl
                      ? t('result.save-result-as-csv.not-csv-encodable')
                      : t('vista.result.export-csv')}
                  </Text>
                }
                placement="left"
                portal
              >
                {csvUrl ? (
                  <Button
                    aria-label={t('vista.result.export-csv')}
                    as="a"
                    data-testid="vista-export-csv"
                    download="query-result.csv"
                    href={csvUrl}
                    icon={DocumentSheetIcon}
                    mode="bleed"
                    padding={2}
                  />
                ) : (
                  <Button
                    aria-label={t('vista.result.export-csv')}
                    data-testid="vista-export-csv"
                    disabled
                    icon={DocumentSheetIcon}
                    mode="bleed"
                    padding={2}
                  />
                )}
              </Tooltip>
              <ResultActionsMenu hasResult={hasResult} result={result} tab={tab} />
            </ActionRail>
          </Flex>
          <Box className={paneFill}>
            <CollapsiblePanel
              activeTabId={activePanelTab}
              collapsed={collapsed}
              id="vista-response"
              onTabChange={setActivePanelTab}
              onToggle={() => setCollapsed((current) => !current)}
              tabs={panelTabs}
            />
          </Box>
        </SplitPane>
      </Box>
    </Flex>
  )
}

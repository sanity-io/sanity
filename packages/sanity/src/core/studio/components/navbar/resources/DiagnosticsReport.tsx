import {
  Badge,
  type BadgeTone,
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Stack,
  Switch,
  Text,
  type TextAlign,
} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type StudioDiagnostics} from '../../../diagnostics'
import {RequestPerformanceReport} from './RequestPerformanceReport'

type DiagnosticStatus = StudioDiagnostics['network']['protocol']['status']

const CodeValue = styled.span`
  font-family: var(--card-code-family, monospace);
  overflow-wrap: anywhere;
`

interface DiagnosticsReportProps {
  diagnostics: StudioDiagnostics
  onRunAgain: () => void
}

/** @internal */
export function DiagnosticsReport({diagnostics, onRunAgain}: DiagnosticsReportProps) {
  const {t} = useTranslation()
  const [useUtc, setUseUtc] = useState(true)
  const {browser, network, schema, studio, user} = diagnostics

  const roles = user.roles.map((role) => role.title || role.name).join(', ')
  const localStorageResult = browser.localStorage
    ? formatStorageResult(browser.localStorage, {
        error: t('diagnostics.status.blocked'),
        success: t('diagnostics.status.enabled'),
        unsupported: t('diagnostics.status.unsupported'),
      })
    : undefined
  const connection = browser.connection
    ? [
        browser.connection.effectiveType,
        formatOptional(browser.connection.downlinkMbps, (value) => `${value} Mbps`),
        formatOptional(browser.connection.roundtripTimeMs, (value) => `${value} ms RTT`),
        browser.connection.saveData ? t('diagnostics.value.save-data') : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined
  const hardware = [
    formatOptional(browser.hardwareConcurrency, (value) =>
      t('diagnostics.value.logical-processors', {count: value}),
    ),
    formatOptional(browser.deviceMemoryGb, (value) =>
      t('diagnostics.value.memory', {memory: value}),
    ),
  ].filter(Boolean)

  return (
    <Stack gap={5}>
      <Card padding={3} radius={2} tone="transparent">
        <Flex align="stretch" direction={['column', 'row']} gap={5}>
          <Box flex={1}>
            <MetricGrid
              metrics={[
                {
                  label: t('diagnostics.field.started-at'),
                  value: formatHeaderTime(diagnostics.startedAt, useUtc),
                },
                {
                  label: t('diagnostics.field.generated-at'),
                  value: formatHeaderTime(diagnostics.generatedAt, useUtc),
                },
                {
                  label: t('diagnostics.field.diagnostic-duration'),
                  value: formatMilliseconds(diagnostics.durationMs),
                },
              ]}
            />
          </Box>
          <Flex align="stretch" direction={['column', 'row']} gap={4}>
            <Stack gap={2}>
              <Text muted size={1}>
                {t('diagnostics.time-zone.toggle')}
              </Text>
              <Switch
                aria-label={t('diagnostics.time-zone.toggle')}
                checked={useUtc}
                onChange={() => setUseUtc((current) => !current)}
              />
            </Stack>
            <Stack gap={2}>
              <Text aria-hidden="true" muted size={1} style={{visibility: 'hidden'}}>
                {t('diagnostics.run-again')}
              </Text>
              <Button mode="default" onClick={onRunAgain} text={t('diagnostics.run-again')} />
            </Stack>
          </Flex>
        </Flex>
      </Card>

      <Grid gap={3} gridTemplateColumns={[1, 1, 2]}>
        <ReportSection testId="diagnostics-studio" title={t('diagnostics.section.studio')}>
          <DetailRow
            label={t('diagnostics.field.studio-version')}
            monospace
            value={studio.version}
          />
          <DetailRow
            label={t('diagnostics.field.react-version')}
            monospace
            value={studio.reactVersion}
          />
          <DetailRow label={t('diagnostics.field.workspace-count')} value={studio.workspaceCount} />
          <DetailRow
            label={t('diagnostics.field.unique-targets')}
            value={studio.uniqueTargetCount}
          />
        </ReportSection>

        <ReportSection testId="diagnostics-workspace" title={t('diagnostics.section.workspace')}>
          <DetailRow
            label={t('diagnostics.field.name')}
            value={studio.workspaceTitle || studio.workspaceName}
          />
          <DetailRow label={t('diagnostics.field.project-id')} monospace value={studio.projectId} />
          <DetailRow label={t('diagnostics.field.dataset')} monospace value={studio.dataset} />
          <DetailRow label={t('diagnostics.field.api-host')} monospace value={studio.apiHost} />
        </ReportSection>

        <ReportSection testId="diagnostics-schema" title={t('diagnostics.section.schema')}>
          <DetailRow label={t('diagnostics.field.document-types')} value={schema.documentTypes} />
          <DetailRow label={t('diagnostics.field.object-types')} value={schema.objectTypes} />
          <DetailRow label={t('diagnostics.field.primitive-types')} value={schema.primitiveTypes} />
        </ReportSection>

        <ReportSection testId="diagnostics-user" title={t('diagnostics.section.user')}>
          <DetailRow label={t('diagnostics.field.user-id')} monospace value={user.id} />
          <DetailRow label={t('diagnostics.field.provider')} value={user.provider} />
          <DetailRow label={t('diagnostics.field.roles')} value={roles || undefined} />
        </ReportSection>

        <ReportSection testId="diagnostics-browser" title={t('diagnostics.section.browser')}>
          <DetailRow
            label={t('diagnostics.field.user-agent')}
            monospace
            truncate
            value={browser.userAgent}
          />
          <DetailRow label={t('diagnostics.field.language')} value={browser.language} />
          <DetailRow label={t('diagnostics.field.timezone')} value={browser.timezone} />
          <DetailRow
            label={t('diagnostics.field.online')}
            value={formatBoolean(
              browser.online,
              t('diagnostics.value.yes'),
              t('diagnostics.value.no'),
            )}
          />
          <DetailRow
            label={t('diagnostics.field.viewport')}
            value={formatDimensions(browser.viewport)}
          />
          <DetailRow
            label={t('diagnostics.field.screen')}
            value={formatDimensions(browser.screen)}
          />
          {connection ? (
            <DetailRow label={t('diagnostics.field.connection-estimate')} value={connection} />
          ) : null}
          <DetailRow label={t('diagnostics.field.local-storage')} value={localStorageResult} />
          <DetailRow
            label={t('diagnostics.field.hardware')}
            value={hardware.length > 0 ? hardware.join(' · ') : undefined}
          />
          <DetailRow
            label={t('diagnostics.field.max-touch-points')}
            value={browser.maxTouchPoints}
          />
        </ReportSection>

        <NetworkReport diagnostics={diagnostics} useUtc={useUtc} />
      </Grid>

      <Stack gap={3}>
        <RequestPerformanceReport
          diagnosticsCompletedAt={diagnostics.generatedAt}
          diagnosticsStartedAt={diagnostics.startedAt}
          history={network.requestHistory}
          useUtc={useUtc}
        />

        <Stack gap={2}>
          <Heading as="h2" size={1}>
            {t('diagnostics.network.listeners')}
          </Heading>
          <Grid
            data-testid="diagnostics-listen-connections"
            gap={3}
            gridTemplateColumns={[1, 1, 2]}
          >
            <Card border data-testid="diagnostics-listen-connection" padding={4} radius={2}>
              <ListenReport
                result={network.listen.first}
                title={t('diagnostics.network.listener-first')}
              />
            </Card>
            <Card border data-testid="diagnostics-listen-connection" padding={4} radius={2}>
              <ListenReport
                result={network.listen.secondWhileFirstOpen}
                title={t('diagnostics.network.listener-second')}
              />
            </Card>
          </Grid>
        </Stack>

        <Stack gap={2}>
          <Heading as="h2" size={1}>
            {t('diagnostics.network.api-requests')}
          </Heading>
          <Stack gap={2}>
            {network.requests.map((request) => (
              <Card border key={request.path} padding={3} radius={2}>
                <Flex
                  align={['flex-start', 'center']}
                  direction={['column', 'row']}
                  gap={3}
                  justify="space-between"
                >
                  <Stack flex={1} gap={2}>
                    <Text size={1} weight="semibold">
                      <CodeValue>{request.path}</CodeValue>
                    </Text>
                    {request.detail || request.error ? (
                      <Text muted size={1}>
                        {request.detail || request.error}
                      </Text>
                    ) : null}
                  </Stack>
                  <Flex align="center" gap={3}>
                    <Text muted size={1}>
                      {formatMilliseconds(request.durationMs)}
                    </Text>
                    <StatusBadge status={request.status} />
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

function ReportSection({
  children,
  testId,
  title,
}: {
  children: ReactNode
  testId?: string
  title: string
}) {
  return (
    <Card border data-testid={testId} padding={4} radius={2}>
      <Stack gap={4}>
        <Heading as="h2" size={1}>
          {title}
        </Heading>
        <Stack gap={3}>{children}</Stack>
      </Stack>
    </Card>
  )
}

function DetailRow({
  label,
  monospace,
  truncate,
  value,
}: {
  label: string
  monospace?: boolean
  truncate?: boolean
  value?: ReactNode
}) {
  const {t} = useTranslation()
  const displayValue = value === undefined || value === '' ? t('diagnostics.value.unknown') : value

  return (
    <Flex align="flex-start" gap={3} justify="space-between">
      <Box flex={1}>
        <Text muted size={1}>
          {label}
        </Text>
      </Box>
      <Box flex={2} style={{minWidth: 0, textAlign: 'right'}}>
        <Text
          size={1}
          textOverflow={truncate ? 'ellipsis' : undefined}
          title={truncate && typeof displayValue === 'string' ? displayValue : undefined}
        >
          {monospace ? <CodeValue>{displayValue}</CodeValue> : displayValue}
        </Text>
      </Box>
    </Flex>
  )
}

function NetworkReport({
  diagnostics,
  useUtc,
}: Pick<DiagnosticsReportProps, 'diagnostics'> & {useUtc: boolean}) {
  const {t} = useTranslation()
  const {protocol, requestHistory, shard} = diagnostics.network
  const timing = protocol.resourceTiming
  const trackingStartedAt = requestHistory.sessionSummary.startedAt
  const protocolStatusLabels: Record<DiagnosticStatus, string> = {
    error: t('diagnostics.status.error'),
    success: t('diagnostics.status.success'),
    timeout: t('diagnostics.status.timeout'),
    unsupported: t('diagnostics.status.unsupported'),
  }
  const protocolValue =
    protocol.protocol === 'unknown' ? protocolStatusLabels[protocol.status] : protocol.protocol

  return (
    <ReportSection testId="diagnostics-network" title={t('diagnostics.section.network')}>
      <DetailRow label={t('diagnostics.network.protocol')} monospace value={protocolValue} />
      <DetailRow
        label={t('diagnostics.network.session-requests')}
        value={requestHistory.sessionSummary.totalRequests.toLocaleString()}
      />
      <DetailRow
        label={t('diagnostics.network.ping-ttfb')}
        value={formatMilliseconds(timing?.requestToFirstByteMs)}
      />
      <DetailRow label={t('diagnostics.network.shard')} monospace value={shard} />
      <DetailRow
        label={t('diagnostics.network.tracking-started')}
        value={formatHeaderTime(trackingStartedAt, useUtc)}
      />
      <DetailRow
        label={t('diagnostics.network.tab-open')}
        value={formatElapsedDuration(trackingStartedAt, diagnostics.generatedAt)}
      />
      {timing && timing.dnsMs > 0 ? (
        <DetailRow label={t('diagnostics.network.dns')} value={formatMilliseconds(timing.dnsMs)} />
      ) : null}
      {timing && timing.connectionMs > 0 ? (
        <DetailRow
          label={t('diagnostics.network.connection')}
          value={formatMilliseconds(timing.connectionMs)}
        />
      ) : null}
      {timing && timing.secureConnectionMs > 0 ? (
        <DetailRow
          label={t('diagnostics.network.tls')}
          value={formatMilliseconds(timing.secureConnectionMs)}
        />
      ) : null}
      {protocol.error ? (
        <Text muted size={1}>
          {protocol.error}
        </Text>
      ) : null}
    </ReportSection>
  )
}

function ListenReport({
  result,
  title,
}: {
  result: StudioDiagnostics['network']['listen']['first']
  title: string
}) {
  const {t} = useTranslation()

  return (
    <Stack gap={4}>
      <Flex align="center" gap={2} wrap="wrap">
        <Text size={1} weight="semibold">
          {title}
        </Text>
        <StatusBadge status={result.status} />
      </Flex>
      <MetricGrid
        gap={3}
        metrics={[
          {
            label: t('diagnostics.network.open-event'),
            value: formatMilliseconds(result.openMs),
          },
          {
            label: t('diagnostics.network.welcome-event'),
            value: formatMilliseconds(result.welcomeMs),
          },
          {
            label: t('diagnostics.network.total'),
            value: formatMilliseconds(result.durationMs),
          },
        ]}
      />
      {result.error ? (
        <Text muted size={1}>
          {result.error}
        </Text>
      ) : null}
    </Stack>
  )
}

interface MetricProps {
  label: string
  value?: string
}

function MetricGrid({gap = 4, metrics}: {gap?: number; metrics: MetricProps[]}) {
  return (
    <Grid gap={gap} gridTemplateColumns={[1, 3]}>
      {metrics.map((metric, index) => (
        <Metric {...metric} align={['left', getMetricAlignment(index)]} key={metric.label} />
      ))}
    </Grid>
  )
}

function getMetricAlignment(index: number): TextAlign {
  const column = index % 3
  if (column === 1) return 'center'
  if (column === 2) return 'right'
  return 'left'
}

function Metric({align, label, value}: MetricProps & {align: TextAlign[]}) {
  const {t} = useTranslation()

  return (
    <Stack gap={2}>
      <Text align={align} muted size={1}>
        {label}
      </Text>
      <Text align={align} size={1} weight="semibold">
        {value ?? t('diagnostics.value.unknown')}
      </Text>
    </Stack>
  )
}

function StatusBadge({status}: {status: DiagnosticStatus}) {
  const {t} = useTranslation()
  const labels: Record<DiagnosticStatus, string> = {
    error: t('diagnostics.status.error'),
    success: t('diagnostics.status.success'),
    timeout: t('diagnostics.status.timeout'),
    unsupported: t('diagnostics.status.unsupported'),
  }

  return (
    <Badge fontSize={0} tone={getStatusTone(status)}>
      {labels[status]}
    </Badge>
  )
}

function getStatusTone(status: DiagnosticStatus): BadgeTone {
  if (status === 'success') return 'positive'
  if (status === 'timeout') return 'caution'
  if (status === 'error') return 'critical'
  return 'default'
}

function formatHeaderTime(value: string, useUtc: boolean): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  if (!useUtc) return date.toLocaleTimeString()

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  })
}

function formatMilliseconds(value?: number): string | undefined {
  return formatOptional(value, (milliseconds) => `${Math.round(milliseconds).toLocaleString()} ms`)
}

function formatElapsedDuration(start: string, end: string): string | undefined {
  const durationMs = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(durationMs) || durationMs < 0) return undefined

  const totalSeconds = Math.floor(durationMs / 1_000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return [
    days > 0 ? `${days}d` : undefined,
    hours > 0 ? `${hours}h` : undefined,
    minutes > 0 ? `${minutes}m` : undefined,
    days === 0 && hours === 0 ? `${seconds}s` : undefined,
  ]
    .filter(Boolean)
    .join(' ')
}

function formatDimensions(value?: {height: number; width: number}): string | undefined {
  return value ? `${value.width} × ${value.height}` : undefined
}

function formatBoolean(value: boolean | undefined, yes: string, no: string): string | undefined {
  return value === undefined ? undefined : value ? yes : no
}

function formatStorageResult(
  result: NonNullable<StudioDiagnostics['browser']['localStorage']>,
  labels: Record<(typeof result)['status'], string>,
): string {
  const label = labels[result.status]
  return result.error ? `${label}: ${result.error}` : label
}

function formatOptional<T>(value: T | undefined, format: (value: T) => string): string | undefined {
  return value === undefined ? undefined : format(value)
}

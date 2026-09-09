/* oxlint-disable i18next/no-literal-string, @sanity/i18n/no-attribute-string-literals -- Diagnostics uses fixed English terminology so support and users see the same technical labels. */
import {
  Badge,
  type BadgeTone,
  Box,
  Card,
  Grid,
  Heading,
  Stack,
  Switch,
  Text,
  type TextAlign,
} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {type StudioDiagnostics} from '../../../diagnostics/gatherStudioDiagnostics'
import {type StyleSheetDiagnostic} from '../../../diagnostics/getStylesDiagnostics'
import {RequestPerformanceReport} from './RequestPerformanceReport'

type DiagnosticStatus = StudioDiagnostics['network']['protocol']['status']

const DIAGNOSTIC_STATUS_LABELS: Record<DiagnosticStatus, string> = {
  error: 'Error',
  success: 'Success',
  timeout: 'Timed out',
  unsupported: 'Unsupported',
}

const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] as const

const CodeValue = styled.span`
  font-family: var(--card-code-family, monospace);
  overflow-wrap: anywhere;
`

/** @internal */
export interface DiagnosticsReportProps {
  diagnostics: StudioDiagnostics
  onRunAgain: () => void
  runAgainLabel?: string
}

/** @internal */
export function DiagnosticsReport({
  diagnostics,
  onRunAgain,
  runAgainLabel = 'Run again',
}: DiagnosticsReportProps) {
  const [useUtc, setUseUtc] = useState(true)
  const {browser, network, schema, studio, styles, user} = diagnostics

  const roles = user.roles.map((role) => role.title || role.name).join(', ')
  const localStorageResult = browser.localStorage
    ? formatStorageResult(browser.localStorage)
    : undefined
  const connection = browser.connection
    ? [
        browser.connection.effectiveType,
        formatOptional(browser.connection.downlinkMbps, (value) => `${value} Mbps`),
        formatOptional(browser.connection.roundtripTimeMs, (value) => `${value} ms RTT`),
        browser.connection.saveData ? 'Save data enabled' : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined
  const hardware = [
    formatOptional(browser.hardwareConcurrency, (value) => `${value} logical processors`),
    formatOptional(browser.deviceMemoryGb, (value) => `${value} GB memory`),
  ].filter(Boolean)

  return (
    <Stack gap={5}>
      <Card padding={3} radius={2} tone="transparent">
        <Flex alignItems="stretch" flexDirection={['column', 'row']} gap={5}>
          <Box flex={1}>
            <MetricGrid
              metrics={[
                {
                  label: 'Started',
                  value: formatHeaderTime(diagnostics.startedAt, useUtc),
                },
                {
                  label: 'Completed',
                  value: formatHeaderTime(diagnostics.generatedAt, useUtc),
                },
                {
                  label: 'Diagnostics duration',
                  value: formatMilliseconds(diagnostics.durationMs),
                },
              ]}
            />
          </Box>
          <Flex alignItems="stretch" flexDirection={['column', 'row']} gap={4}>
            <Stack gap={2}>
              <Text muted size={1}>
                UTC time
              </Text>
              <Switch
                aria-label="UTC time"
                checked={useUtc}
                onChange={() => setUseUtc((current) => !current)}
              />
            </Stack>
            <Stack gap={2}>
              <Text aria-hidden="true" muted size={1} style={{visibility: 'hidden'}}>
                {runAgainLabel}
              </Text>
              <Button mode="default" onClick={onRunAgain} text={runAgainLabel} />
            </Stack>
          </Flex>
        </Flex>
      </Card>

      <Grid gap={3} gridTemplateColumns={[1, 1, 2]}>
        <ReportSection testId="diagnostics-studio" title="Studio">
          <DetailRow label="Studio version" monospace value={studio.version} />
          <DetailRow label="React version" monospace value={studio.reactVersion} />
          <DetailRow label="Workspaces" value={studio.workspaceCount} />
          <DetailRow label="Unique targets" value={studio.uniqueTargetCount} />
          <DetailRow label="Auto-updates" value={formatEnabled(studio.autoUpdates)} />
        </ReportSection>

        <ReportSection testId="diagnostics-workspace" title="Workspace">
          <DetailRow label="Name" value={studio.workspaceTitle || studio.workspaceName} />
          <DetailRow label="Project ID" monospace value={studio.projectId} />
          <DetailRow label="Dataset" monospace value={studio.dataset} />
          <DetailRow label="API host" monospace value={studio.apiHost} />
        </ReportSection>

        <ReportSection testId="diagnostics-schema" title="Schema">
          <DetailRow label="Document types" value={schema.documentTypes} />
          <DetailRow label="Object types" value={schema.objectTypes} />
          <DetailRow label="Primitive types" value={schema.primitiveTypes} />
        </ReportSection>

        <ReportSection testId="diagnostics-user" title="User">
          <DetailRow label="User ID" monospace value={user.id} />
          <DetailRow label="Provider" value={user.provider} />
          <DetailRow label="Roles" value={roles || undefined} />
        </ReportSection>

        <ReportSection testId="diagnostics-browser" title="Browser">
          <DetailRow label="User agent" monospace truncate value={browser.userAgent} />
          <DetailRow label="Language" value={browser.language} />
          <DetailRow label="Timezone" value={browser.timezone} />
          <DetailRow label="Online" value={formatBoolean(browser.online)} />
          <DetailRow label="Viewport" value={formatDimensions(browser.viewport)} />
          <DetailRow label="Screen" value={formatDimensions(browser.screen)} />
          {connection ? <DetailRow label="Connection estimate" value={connection} /> : null}
          <DetailRow label="Local storage" value={localStorageResult} />
          <DetailRow
            label="Hardware"
            value={hardware.length > 0 ? hardware.join(' · ') : undefined}
          />
          <DetailRow label="Max touch points" value={browser.maxTouchPoints} />
        </ReportSection>

        <NetworkReport diagnostics={diagnostics} useUtc={useUtc} />

        {styles && styles.styledComponents.length > 0 ? (
          <StyledComponentsReport sheets={styles.styledComponents} />
        ) : null}
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
            Listen connection tests
          </Heading>
          <Grid
            data-testid="diagnostics-listen-connections"
            gap={3}
            gridTemplateColumns={[1, 1, 2]}
          >
            <Card border data-testid="diagnostics-listen-connection" padding={4} radius={2}>
              <ListenReport result={network.listen.first} title="First connection" />
            </Card>
            <Card border data-testid="diagnostics-listen-connection" padding={4} radius={2}>
              <ListenReport
                result={network.listen.secondWhileFirstOpen}
                title="Second connection while first is open"
              />
            </Card>
          </Grid>
        </Stack>

        <Stack gap={2}>
          <Heading as="h2" size={1}>
            API request tests
          </Heading>
          <Stack gap={2}>
            {network.requests.map((request) => (
              <Card border key={request.path} padding={3} radius={2}>
                <Flex
                  alignItems={['flex-start', 'center']}
                  flexDirection={['column', 'row']}
                  gap={3}
                  justifyContent="space-between"
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
                  <Flex alignItems="center" gap={3}>
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
  wideLabel,
}: {
  label: ReactNode
  monospace?: boolean
  truncate?: boolean
  value?: ReactNode
  wideLabel?: boolean
}) {
  const displayValue = value === undefined || value === '' ? 'Unknown' : value

  return (
    <Flex alignItems="flex-start" gap={3} justifyContent="space-between">
      <Box flex={wideLabel ? 3 : 1}>
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

// Every styled-components runtime on the page owns one `<style data-styled>` sheet, so a second
// sheet means a plugin bundled or inlined its own copy instead of using the peer dependency.
function StyledComponentsReport({sheets}: {sheets: StyleSheetDiagnostic[]}) {
  const versions = Array.from(new Set(sheets.map((sheet) => sheet.version ?? 'unknown version')))
  const ruleCount = sheets.reduce((sum, sheet) => sum + sheet.ruleCount, 0)
  const sizeBytes = sheets.every((sheet) => sheet.sizeBytes !== undefined)
    ? sheets.reduce((sum, sheet) => sum + (sheet.sizeBytes ?? 0), 0)
    : undefined
  const multipleRuntimes = sheets.length > 1

  return (
    <ReportSection testId="diagnostics-styled-components" title="styled-components">
      <DetailRow
        label={versions.length > 1 ? 'Versions' : 'Version'}
        monospace
        value={versions.join(', ')}
      />
      <DetailRow
        label={<CodeValue>{'<style data-styled>'}</CodeValue>}
        wideLabel
        value={
          multipleRuntimes ? (
            <Flex alignItems="center" gap={2} justifyContent="flex-end">
              {sheets.length}
              <Badge fontSize={0} tone="caution">
                Expected 1
              </Badge>
            </Flex>
          ) : (
            sheets.length
          )
        }
      />
      <DetailRow label="CSS rules inserted by JS" value={ruleCount.toLocaleString()} wideLabel />
      <DetailRow label="CSS size inserted by JS" value={formatByteSize(sizeBytes)} wideLabel />
      {multipleRuntimes ? (
        <Text data-testid="diagnostics-styled-components-sheets" muted size={1}>
          {sheets
            .map(
              (sheet) =>
                `${sheet.version ?? 'unknown version'}: ${sheet.ruleCount.toLocaleString()} rules, ${formatByteSize(sheet.sizeBytes) ?? 'unknown size'}`,
            )
            .join(' · ')}
        </Text>
      ) : null}
    </ReportSection>
  )
}

function NetworkReport({
  diagnostics,
  useUtc,
}: Pick<DiagnosticsReportProps, 'diagnostics'> & {useUtc: boolean}) {
  const {geoIpCountry, protocol, requestHistory, shard} = diagnostics.network
  const timing = protocol.resourceTiming
  const trackingStartedAt = requestHistory.sessionSummary.startedAt
  const protocolValue =
    protocol.protocol === 'unknown' ? DIAGNOSTIC_STATUS_LABELS[protocol.status] : protocol.protocol

  return (
    <ReportSection testId="diagnostics-network" title="Network">
      <DetailRow label="Protocol" monospace value={protocolValue} />
      <DetailRow
        label="Session requests"
        value={requestHistory.sessionSummary.totalRequests.toLocaleString()}
      />
      <DetailRow label="Ping TTFB" value={formatMilliseconds(timing?.requestToFirstByteMs)} />
      <DetailRow label="Shard" monospace value={shard} />
      <DetailRow label="GeoIP country" monospace value={geoIpCountry ?? undefined} />
      <DetailRow label="Tracking started" value={formatHeaderTime(trackingStartedAt, useUtc)} />
      <DetailRow
        label="Tab open"
        value={formatElapsedDuration(trackingStartedAt, diagnostics.generatedAt)}
      />
      {timing && timing.dnsMs > 0 ? (
        <DetailRow label="DNS" value={formatMilliseconds(timing.dnsMs)} />
      ) : null}
      {timing && timing.connectionMs > 0 ? (
        <DetailRow label="Connection" value={formatMilliseconds(timing.connectionMs)} />
      ) : null}
      {timing && timing.secureConnectionMs > 0 ? (
        <DetailRow label="TLS" value={formatMilliseconds(timing.secureConnectionMs)} />
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
  return (
    <Stack gap={4}>
      <Flex alignItems="center" gap={2} flexWrap="wrap">
        <Text size={1} weight="semibold">
          {title}
        </Text>
        <StatusBadge status={result.status} />
      </Flex>
      <MetricGrid
        gap={3}
        metrics={[
          {
            label: 'Open event',
            value: formatMilliseconds(result.openMs),
          },
          {
            label: 'Welcome event',
            value: formatMilliseconds(result.welcomeMs),
          },
          {
            label: 'Total',
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
  return (
    <Stack gap={2}>
      <Text align={align} muted size={1}>
        {label}
      </Text>
      <Text align={align} size={1} weight="semibold">
        {value ?? 'Unknown'}
      </Text>
    </Stack>
  )
}

function StatusBadge({status}: {status: DiagnosticStatus}) {
  return (
    <Badge fontSize={0} tone={getStatusTone(status)}>
      {DIAGNOSTIC_STATUS_LABELS[status]}
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

function formatByteSize(value?: number): string | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined

  const unitIndex = Math.min(
    Math.max(0, Math.floor(Math.log(Math.max(value, 1)) / Math.log(1_000))),
    BYTE_UNITS.length - 1,
  )
  const amount = value / 1_000 ** unitIndex

  return `${amount.toLocaleString(undefined, {maximumFractionDigits: 2})} ${BYTE_UNITS[unitIndex]}`
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

function formatBoolean(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'Yes' : 'No'
}

function formatEnabled(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'Enabled' : 'Disabled'
}

function formatStorageResult(
  result: NonNullable<StudioDiagnostics['browser']['localStorage']>,
): string {
  const labels: Record<(typeof result)['status'], string> = {
    error: 'Blocked',
    success: 'Enabled',
    unsupported: 'Unsupported',
  }
  const label = labels[result.status]
  return result.error ? `${label}: ${result.error}` : label
}

function formatOptional<T>(value: T | undefined, format: (value: T) => string): string | undefined {
  return value === undefined ? undefined : format(value)
}

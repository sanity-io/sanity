import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {type StudioDiagnostics} from '../../../diagnostics/gatherStudioDiagnostics'
import {DiagnosticsReport} from './DiagnosticsReport'

const diagnostics: StudioDiagnostics = {
  browser: {
    connection: {downlinkMbps: 12.5, effectiveType: '4g', roundtripTimeMs: 40},
    hardwareConcurrency: 8,
    language: 'en-US',
    localStorage: {status: 'success'},
    maxTouchPoints: 5,
    online: true,
    screen: {availableHeight: 1_040, availableWidth: 1_920, height: 1_080, width: 1_920},
    timezone: 'America/Los_Angeles',
    userAgent: 'Test browser',
    viewport: {height: 800, width: 1_200},
  },
  diagnosticVersion: 1,
  durationMs: 10_420,
  generatedAt: '2026-08-21T12:00:00.000Z',
  network: {
    geoIpCountry: 'US',
    listen: {
      first: {
        durationMs: 120,
        openMs: 60,
        path: '/listen?query=*',
        status: 'success',
        timedOut: false,
        welcomeMs: 120,
      },
      secondWhileFirstOpen: {
        durationMs: 10_000,
        openMs: 80,
        path: '/listen?query=*',
        status: 'timeout',
        timedOut: true,
      },
    },
    protocol: {
      durationMs: 95,
      protocol: 'h2',
      resourceTiming: {
        connectionMs: 12,
        decodedBodySizeBytes: 4,
        dnsMs: 3,
        durationMs: 90,
        encodedBodySizeBytes: 4,
        initiatorType: 'fetch',
        redirectMs: 0,
        requestToFirstByteMs: 65,
        responseTransferMs: 10,
        secureConnectionMs: 8,
        serverTiming: [],
        startTimeMs: 1,
        transferSizeBytes: 304,
      },
      responseOk: true,
      responseStatus: 200,
      status: 'success',
      timedOut: false,
    },
    requestHistory: {
      dataset: 'production',
      entries: [
        {
          apiVersion: 'v2025-02-19',
          bucket: 'query',
          dataset: 'production',
          durationMs: 42,
          projectId: 'test-project',
          startedAt: '2026-08-21T11:59:30.000Z',
          status: 'success',
        },
        {
          apiVersion: 'v2025-02-19',
          bucket: 'query',
          dataset: 'production',
          durationMs: 120,
          projectId: 'test-project',
          startedAt: '2026-08-21T11:59:32.000Z',
          status: 'success',
        },
        {
          apiVersion: 'v2025-02-19',
          bucket: 'doc',
          dataset: 'production',
          durationMs: 85,
          projectId: 'test-project',
          startedAt: '2026-08-21T11:59:34.000Z',
          status: 'error',
        },
        {
          apiVersion: 'v2025-02-19',
          bucket: 'query',
          dataset: 'production',
          durationMs: 65,
          projectId: 'test-project',
          startedAt: '2026-08-21T11:59:55.000Z',
          status: 'success',
        },
      ],
      maxEntries: 500,
      projectId: 'test-project',
      sessionSummary: {
        buckets: [
          {bucket: 'doc', count: 1, maxMs: 85, medianMs: 85, p95Ms: 85},
          {bucket: 'query', count: 2, maxMs: 120, medianMs: 42, p95Ms: 120},
        ],
        startedAt: '2026-08-21T11:00:00.000Z',
        totalRequests: 3,
      },
      totalRequests: 4,
      truncated: false,
    },
    requests: [
      {
        detail: 'pong',
        durationMs: 42,
        path: '/ping',
        status: 'success',
        timedOut: false,
      },
      {
        detail: 'US',
        durationMs: 38,
        path: '/geoip/country',
        status: 'success',
        timedOut: false,
      },
      {
        durationMs: 10_000,
        path: '/query?query=1',
        status: 'timeout',
        timedOut: true,
      },
      {
        detail: '1 result',
        durationMs: 85,
        path: '/query?query=*[0]._id',
        status: 'success',
        timedOut: false,
      },
    ],
    shard: 'gcp-eu-west1-01',
  },
  schema: {documentTypes: 4, objectTypes: 6, primitiveTypes: 2},
  startedAt: '2026-08-21T11:59:49.580Z',
  studio: {
    apiHost: 'https://test.api.sanity.io',
    autoUpdates: true,
    basePath: '/',
    dataset: 'production',
    location: 'http://localhost:3333/structure',
    projectId: 'test-project',
    reactVersion: '19.2.0',
    uniqueTargetCount: 2,
    version: '4.0.0',
    workspaceCount: 3,
    workspaceName: 'default',
    workspaceTitle: 'Test workspace',
  },
  styles: {styledComponents: [{ruleCount: 1_234, sizeBytes: 12_345, version: '6.5.3'}]},
  user: {
    id: 'user-id',
    provider: 'sanity',
    roles: [{name: 'administrator', title: 'Administrator'}],
  },
}

describe('DiagnosticsReport', () => {
  it('renders readable sections and network measurements', async () => {
    const onRunAgain = vi.fn()
    const userInteraction = userEvent.setup()

    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport diagnostics={diagnostics} onRunAgain={onRunAgain} />
      </ThemeProvider>,
    )

    expect(screen.getByText('Studio')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Schema')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Browser')).toBeInTheDocument()
    expect(screen.getByText('Network')).toBeInTheDocument()
    expect(screen.getByText('Test workspace')).toBeInTheDocument()
    expect(screen.getByText('10,420 ms')).toBeInTheDocument()
    expect(screen.getByText('h2')).toBeInTheDocument()
    expect(screen.getByText('65 ms')).toBeInTheDocument()
    expect(screen.getByText('/ping')).toBeInTheDocument()
    expect(screen.getByText('/geoip/country')).toBeInTheDocument()
    expect(screen.getByText('/query?query=*[0]._id')).toBeInTheDocument()
    expect(screen.getByText('Recent request timings')).toBeInTheDocument()
    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(3)
    expect(screen.getAllByText('Timed out')).toHaveLength(2)

    const studio = within(screen.getByTestId('diagnostics-studio'))
    expect(studio.getByText('4.0.0')).toBeInTheDocument()
    expect(studio.getByText('19.2.0')).toBeInTheDocument()
    expect(studio.getByText('3')).toBeInTheDocument()
    expect(studio.getByText('Unique targets')).toBeInTheDocument()
    expect(studio.getByText('2')).toBeInTheDocument()
    expect(studio.queryByText('test-project')).not.toBeInTheDocument()
    expect(studio.getByText('Auto-updates')).toBeInTheDocument()
    expect(studio.getByText('Enabled')).toBeInTheDocument()
    expect(studio.queryByText('6.5.3')).not.toBeInTheDocument()

    const styledComponents = within(screen.getByTestId('diagnostics-styled-components'))
    expect(styledComponents.getByText('styled-components')).toBeInTheDocument()
    expect(styledComponents.getByText('Version')).toBeInTheDocument()
    expect(styledComponents.getByText('6.5.3')).toBeInTheDocument()
    expect(styledComponents.getByText('<style data-styled>')).toBeInTheDocument()
    expect(styledComponents.getByText('1')).toBeInTheDocument()
    expect(styledComponents.getByText('CSS rules inserted by JS')).toBeInTheDocument()
    expect(styledComponents.getByText((1_234).toLocaleString())).toBeInTheDocument()
    expect(styledComponents.getByText('CSS size inserted by JS')).toBeInTheDocument()
    expect(styledComponents.getByText(formatExpectedByteSize(12_345))).toBeInTheDocument()
    expect(styledComponents.queryByText('Expected 1')).not.toBeInTheDocument()
    expect(
      styledComponents.queryByTestId('diagnostics-styled-components-sheets'),
    ).not.toBeInTheDocument()

    const workspace = within(screen.getByTestId('diagnostics-workspace'))
    expect(workspace.getByText('Name')).toBeInTheDocument()
    expect(workspace.getByText('test-project')).toBeInTheDocument()
    expect(workspace.getByText('production')).toBeInTheDocument()
    expect(workspace.getByText('https://test.api.sanity.io')).toBeInTheDocument()
    expect(workspace.queryByText('API version')).not.toBeInTheDocument()

    const schema = within(screen.getByTestId('diagnostics-schema'))
    expect(schema.getByText('Document types')).toBeInTheDocument()
    expect(schema.getByText('Object types')).toBeInTheDocument()
    expect(schema.getByText('Primitive types')).toBeInTheDocument()
    expect(schema.getByText('4')).toBeInTheDocument()
    expect(schema.getByText('6')).toBeInTheDocument()
    expect(schema.getByText('2')).toBeInTheDocument()

    const browser = within(screen.getByTestId('diagnostics-browser'))
    expect(browser.getByText('Max touch points')).toBeInTheDocument()
    expect(browser.getByText('5')).toBeInTheDocument()
    expect(browser.getByText('Enabled')).toBeInTheDocument()
    expect(browser.queryByText('Success')).not.toBeInTheDocument()
    expect(browser.getByTitle('Test browser')).toBeInTheDocument()

    const network = within(screen.getByTestId('diagnostics-network'))
    expect(network.getByText('h2')).toBeInTheDocument()
    expect(network.getByText('gcp-eu-west1-01')).toBeInTheDocument()
    expect(network.getByText('GeoIP country')).toBeInTheDocument()
    expect(network.getByText('US')).toBeInTheDocument()
    expect(network.getByText('Session requests')).toBeInTheDocument()
    expect(network.getByText('Ping TTFB')).toBeInTheDocument()
    expect(network.getByText('Tracking started')).toBeInTheDocument()
    expect(network.getByText('Tab open')).toBeInTheDocument()
    expect(network.getByText('DNS')).toBeInTheDocument()
    expect(network.getByText('Connection')).toBeInTheDocument()
    expect(network.getByText('TLS')).toBeInTheDocument()

    const user = within(screen.getByTestId('diagnostics-user'))
    expect(user.queryByText('Email')).not.toBeInTheDocument()
    expect(user.queryByText('Name')).not.toBeInTheDocument()
    expect(user.getByText('user-id')).toBeInTheDocument()

    const listenConnections = within(screen.getByTestId('diagnostics-listen-connections'))
    expect(listenConnections.getAllByTestId('diagnostics-listen-connection')).toHaveLength(2)
    expect(listenConnections.getByText('First connection')).toBeInTheDocument()
    expect(listenConnections.getByText('Second connection while first is open')).toBeInTheDocument()

    const timeZoneToggle = screen.getByRole('checkbox', {
      name: 'UTC time',
    })
    expect(timeZoneToggle).toBeChecked()
    expect(screen.getByText('UTC time')).toBeInTheDocument()
    expect(screen.getByText(formatUtcTime(diagnostics.startedAt))).toBeInTheDocument()

    await userInteraction.click(timeZoneToggle)
    expect(timeZoneToggle).not.toBeChecked()
    expect(
      screen.getByText(new Date(diagnostics.startedAt).toLocaleTimeString()),
    ).toBeInTheDocument()

    await userInteraction.click(screen.getByRole('button', {name: 'Run again'}))
    expect(onRunAgain).toHaveBeenCalledOnce()
  })

  it('flags multiple styled-components runtimes and lists each style node', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            styles: {
              styledComponents: [
                {ruleCount: 900, sizeBytes: 12_000, version: '6.5.3'},
                {ruleCount: 120, sizeBytes: 450},
              ],
            },
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const styledComponents = within(screen.getByTestId('diagnostics-styled-components'))
    expect(styledComponents.getByText('Versions')).toBeInTheDocument()
    expect(styledComponents.getByText('6.5.3, unknown version')).toBeInTheDocument()
    expect(styledComponents.getByText('2')).toBeInTheDocument()
    expect(styledComponents.getByText('Expected 1')).toBeInTheDocument()
    expect(styledComponents.getByText((1_020).toLocaleString())).toBeInTheDocument()
    expect(styledComponents.getByText(formatExpectedByteSize(12_450))).toBeInTheDocument()
    expect(styledComponents.getByTestId('diagnostics-styled-components-sheets')).toHaveTextContent(
      `6.5.3: 900 rules, ${formatExpectedByteSize(12_000)} · unknown version: 120 rules, ${formatExpectedByteSize(450)}`,
    )
  })

  it('omits invalid styled-components CSS sizes', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            styles: {styledComponents: [{ruleCount: 12, sizeBytes: Number.NaN, version: '6.5.3'}]},
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const styledComponents = within(screen.getByTestId('diagnostics-styled-components'))
    expect(styledComponents.getByText('CSS size inserted by JS')).toBeInTheDocument()
    expect(styledComponents.getByText('Unknown')).toBeInTheDocument()
    expect(styledComponents.queryByText('NaN undefined')).not.toBeInTheDocument()
  })

  it('omits the styled-components card when no sheet is on the page', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{...diagnostics, styles: {styledComponents: []}}}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    expect(screen.queryByTestId('diagnostics-styled-components')).not.toBeInTheDocument()
    expect(screen.queryByText('Expected 1')).not.toBeInTheDocument()
  })

  it('omits the styled-components card and shows unknown flags for reports from older studios', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            studio: {...diagnostics.studio, autoUpdates: undefined},
            styles: undefined,
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const studio = within(screen.getByTestId('diagnostics-studio'))
    expect(studio.getByText('Unknown')).toBeInTheDocument()
    expect(screen.queryByTestId('diagnostics-styled-components')).not.toBeInTheDocument()
  })

  it('hides connection setup timings when the browser reports zero', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            network: {
              ...diagnostics.network,
              protocol: {
                ...diagnostics.network.protocol,
                resourceTiming: {
                  ...diagnostics.network.protocol.resourceTiming!,
                  connectionMs: 0,
                  dnsMs: 0,
                  secureConnectionMs: 0,
                },
              },
            },
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const network = within(screen.getByTestId('diagnostics-network'))
    expect(network.queryByText('DNS')).not.toBeInTheDocument()
    expect(network.queryByText('Connection')).not.toBeInTheDocument()
    expect(network.queryByText('TLS')).not.toBeInTheDocument()
    expect(network.queryByText('Total')).not.toBeInTheDocument()
    expect(network.queryByText('Response status')).not.toBeInTheDocument()
    expect(network.queryByText('Response')).not.toBeInTheDocument()
    expect(network.queryByText('Transferred')).not.toBeInTheDocument()
  })

  it('hides the connection estimate when it is unknown', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            browser: {...diagnostics.browser, connection: undefined},
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const browser = within(screen.getByTestId('diagnostics-browser'))
    expect(browser.queryByText('Connection estimate')).not.toBeInTheDocument()
  })

  it('shows an unknown GeoIP country when it could not be resolved', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DiagnosticsReport
          diagnostics={{
            ...diagnostics,
            network: {...diagnostics.network, geoIpCountry: null},
          }}
          onRunAgain={vi.fn()}
        />
      </ThemeProvider>,
    )

    const network = within(screen.getByTestId('diagnostics-network'))
    expect(network.getByText('GeoIP country')).toBeInTheDocument()
    expect(network.getByText('Unknown')).toBeInTheDocument()
  })
})

function formatUtcTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  })
}

function formatExpectedByteSize(value: number): string {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] as const
  const unitIndex = Math.min(
    Math.max(0, Math.floor(Math.log(Math.max(value, 1)) / Math.log(1_000))),
    units.length - 1,
  )
  const amount = value / 1_000 ** unitIndex
  return `${amount.toLocaleString(undefined, {maximumFractionDigits: 2})} ${units[unitIndex]}`
}

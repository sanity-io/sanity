import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {type StudioDiagnostics} from '../../../diagnostics'
import {DiagnosticsReport} from './DiagnosticsReport'

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

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
    requests: [
      {
        detail: 'pong',
        durationMs: 42,
        path: '/ping',
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
  },
  schema: {documentTypes: 4, objectTypes: 6, primitiveTypes: 2},
  startedAt: '2026-08-21T11:59:49.580Z',
  studio: {
    apiHost: 'https://test.api.sanity.io',
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

    expect(screen.getByText('diagnostics.section.studio')).toBeInTheDocument()
    expect(screen.getByText('diagnostics.section.workspace')).toBeInTheDocument()
    expect(screen.getByText('diagnostics.section.schema')).toBeInTheDocument()
    expect(screen.getByText('diagnostics.section.user')).toBeInTheDocument()
    expect(screen.getByText('diagnostics.section.browser')).toBeInTheDocument()
    expect(screen.getByText('diagnostics.section.network')).toBeInTheDocument()
    expect(screen.getByText('Test workspace')).toBeInTheDocument()
    expect(screen.getByText('10,420 ms')).toBeInTheDocument()
    expect(screen.getByText('h2')).toBeInTheDocument()
    expect(screen.getByText('65 ms')).toBeInTheDocument()
    expect(screen.getByText('/ping')).toBeInTheDocument()
    expect(screen.getByText('/query?query=*[0]._id')).toBeInTheDocument()
    expect(screen.getAllByText('diagnostics.status.timeout')).toHaveLength(2)

    const studio = within(screen.getByTestId('diagnostics-studio'))
    expect(studio.getByText('4.0.0')).toBeInTheDocument()
    expect(studio.getByText('19.2.0')).toBeInTheDocument()
    expect(studio.getByText('3')).toBeInTheDocument()
    expect(studio.getByText('diagnostics.field.unique-targets')).toBeInTheDocument()
    expect(studio.getByText('2')).toBeInTheDocument()
    expect(studio.queryByText('test-project')).not.toBeInTheDocument()

    const workspace = within(screen.getByTestId('diagnostics-workspace'))
    expect(workspace.getByText('diagnostics.field.name')).toBeInTheDocument()
    expect(workspace.getByText('test-project')).toBeInTheDocument()
    expect(workspace.getByText('production')).toBeInTheDocument()
    expect(workspace.getByText('https://test.api.sanity.io')).toBeInTheDocument()
    expect(screen.queryByText('diagnostics.field.api-version')).not.toBeInTheDocument()

    const schema = within(screen.getByTestId('diagnostics-schema'))
    expect(schema.getByText('diagnostics.field.document-types')).toBeInTheDocument()
    expect(schema.getByText('diagnostics.field.object-types')).toBeInTheDocument()
    expect(schema.getByText('diagnostics.field.primitive-types')).toBeInTheDocument()
    expect(schema.getByText('4')).toBeInTheDocument()
    expect(schema.getByText('6')).toBeInTheDocument()
    expect(schema.getByText('2')).toBeInTheDocument()

    const browser = within(screen.getByTestId('diagnostics-browser'))
    expect(browser.getByText('diagnostics.field.max-touch-points')).toBeInTheDocument()
    expect(browser.getByText('5')).toBeInTheDocument()
    expect(browser.getByText('diagnostics.status.enabled')).toBeInTheDocument()
    expect(browser.queryByText('diagnostics.status.success')).not.toBeInTheDocument()
    expect(browser.getByTitle('Test browser')).toBeInTheDocument()

    const user = within(screen.getByTestId('diagnostics-user'))
    expect(user.queryByText('diagnostics.field.email')).not.toBeInTheDocument()
    expect(user.queryByText('diagnostics.field.name')).not.toBeInTheDocument()
    expect(user.getByText('user-id')).toBeInTheDocument()

    const listenConnections = within(screen.getByTestId('diagnostics-listen-connections'))
    expect(listenConnections.getByText('diagnostics.network.listener-first')).toBeInTheDocument()
    expect(listenConnections.getByText('diagnostics.network.listener-second')).toBeInTheDocument()

    await userInteraction.click(screen.getByRole('button', {name: 'diagnostics.run-again'}))
    expect(onRunAgain).toHaveBeenCalledOnce()
  })
})

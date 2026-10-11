import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type StudioDiagnostics} from '../../../../diagnostics/gatherStudioDiagnostics'
import {DiagnosticsReport} from '../DiagnosticsReport'

const listen = {
  durationMs: 42,
  path: '/listen?query=*',
  status: 'success',
  timedOut: false,
} as const

const diagnostics: StudioDiagnostics = {
  browser: {
    hardwareConcurrency: 8,
    language: 'en-US',
    localStorage: {status: 'success'},
    online: true,
    timezone: 'UTC',
    userAgent: 'Storybook browser',
    viewport: {height: 900, width: 1_280},
  },
  diagnosticVersion: 1,
  durationMs: 128,
  generatedAt: '2026-08-21T12:00:00.128Z',
  network: {
    listen: {first: listen, secondWhileFirstOpen: listen},
    protocol: {
      durationMs: 42,
      protocol: 'h2',
      responseOk: true,
      responseStatus: 200,
      status: 'success',
      timedOut: false,
    },
    requestHistory: {
      dataset: 'production',
      entries: [],
      maxEntries: 500,
      projectId: 'storybook',
      sessionSummary: {
        buckets: [],
        startedAt: '2026-08-21T11:30:00.000Z',
        totalRequests: 24,
      },
      totalRequests: 24,
      truncated: false,
    },
    requests: [],
  },
  schema: {documentTypes: 12, objectTypes: 24, primitiveTypes: 7},
  startedAt: '2026-08-21T12:00:00.000Z',
  studio: {
    apiHost: 'https://storybook.api.sanity.io',
    autoUpdates: false,
    dataset: 'production',
    projectId: 'storybook',
    reactVersion: '19.2.0',
    uniqueTargetCount: 1,
    version: '4.0.0',
    workspaceCount: 1,
    workspaceName: 'default',
    workspaceTitle: 'Storybook workspace',
  },
  styles: {
    styledComponents: [
      {ruleCount: 1_234, sizeBytes: 112_450, version: '6.1.19'},
      {ruleCount: 86, sizeBytes: 8_720, version: '5.3.11'},
    ],
  },
  user: {
    id: 'storybook-user',
    provider: 'sanity',
    roles: [{name: 'administrator', title: 'Administrator'}],
  },
}

/**
 * Shows a complete diagnostics report with multiple styled-components runtimes so the rule count,
 * generated CSS size, version warning, and per-runtime summary stay visually covered.
 */
export function DiagnosticsReportStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <DiagnosticsReport diagnostics={diagnostics} onRunAgain={() => undefined} />
      </Card>
    </TestWrapper>
  )
}

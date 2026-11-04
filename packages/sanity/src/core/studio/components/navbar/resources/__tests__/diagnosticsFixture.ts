import {type StudioDiagnostics} from '../../../../diagnostics/gatherStudioDiagnostics'

const listen = {
  durationMs: 42,
  path: '/listen?query=*',
  status: 'success',
  timedOut: false,
} as const

/**
 * A complete, successful diagnostics run with multiple styled-components
 * runtimes so the rule count, generated CSS size, version warning, and
 * per-runtime summary all render.
 */
export const DIAGNOSTICS_FIXTURE: StudioDiagnostics = {
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

const skippedRequest = (path: string) =>
  ({durationMs: 0, path, skipReason: 'time-limit', status: 'skipped', timedOut: false}) as const

/**
 * A run in a browser where Studio tabs hold most of the connection's request slots: the ping
 * times out, listeners can't connect, and the run stops at its time limit.
 */
export const SATURATED_DIAGNOSTICS_FIXTURE: StudioDiagnostics = {
  ...DIAGNOSTICS_FIXTURE,
  durationMs: 8_620,
  maxDurationMs: 20_000,
  network: {
    ...DIAGNOSTICS_FIXTURE.network,
    connections: {
      currentTab: {
        longestPending: [
          {ageMs: 14_200, bucket: 'query', kind: 'request', tag: 'sanity.studio.search'},
        ],
        oldestPendingMs: 14_200,
        openStreams: 6,
        pendingRequests: 2,
        totalStarted: 31,
      },
      tabs: {
        status: 'success',
        tabs: [],
        totals: {oldestPendingMs: 41_000, openStreams: 97, pendingRequests: 18, tabs: 3},
        waitedMs: 1_001,
      },
    },
    listen: {
      first: {durationMs: 3_000, path: '/listen?query=*', status: 'timeout', timedOut: true},
      secondWhileFirstOpen: {
        durationMs: 0,
        path: '/listen?query=*',
        skipReason: 'first-connection-failed',
        status: 'skipped',
        timedOut: false,
      },
    },
    protocol: {durationMs: 2_500, protocol: 'unknown', status: 'timeout', timedOut: true},
    requests: [
      {durationMs: 3_000, path: '/ping', status: 'timeout', timedOut: true},
      {durationMs: 3_000, path: '/geoip/country', status: 'timeout', timedOut: true},
      {durationMs: 3_000, path: '/query?query=1', status: 'timeout', timedOut: true},
      skippedRequest('/query?query=*[0]._id'),
      skippedRequest('/doc/<random-nonexistent-id>'),
    ],
    shard: undefined,
    stalled: true,
  },
}

import {describe, expect, it} from 'vitest'

import {type StudioDiagnostics} from './gatherStudioDiagnostics'
import {parseStudioDiagnostics} from './parseStudioDiagnostics'

const listen = {
  durationMs: 120,
  path: '/listen?query=*',
  status: 'success',
  timedOut: false,
} as const

const report: StudioDiagnostics = {
  browser: {},
  diagnosticVersion: 1,
  durationMs: 10_420,
  generatedAt: '2026-08-21T12:00:00.000Z',
  network: {
    listen: {first: listen, secondWhileFirstOpen: listen},
    protocol: {durationMs: 95, protocol: 'h2', status: 'success', timedOut: false},
    requestHistory: {
      dataset: 'production',
      entries: [],
      maxEntries: 500,
      projectId: 'test-project',
      sessionSummary: {buckets: [], startedAt: '2026-08-21T11:00:00.000Z', totalRequests: 0},
      totalRequests: 0,
      truncated: false,
    },
    requests: [],
  },
  schema: {documentTypes: 4, objectTypes: 6, primitiveTypes: 2},
  startedAt: '2026-08-21T11:59:49.580Z',
  studio: {
    dataset: 'production',
    projectId: 'test-project',
    reactVersion: '19.2.0',
    uniqueTargetCount: 2,
    version: '4.0.0',
    workspaceCount: 3,
  },
  user: {roles: []},
}

function parse(value: unknown): StudioDiagnostics {
  return parseStudioDiagnostics(JSON.stringify(value))
}

describe('parseStudioDiagnostics', () => {
  it('accepts reports from studios that predate styles and auto-update fields', () => {
    expect(parse(report)).toEqual(report)
  })

  it('accepts reports carrying styles and auto-update fields', () => {
    const extended: StudioDiagnostics = {
      ...report,
      studio: {...report.studio, autoUpdates: true},
      styles: {
        styledComponents: [
          {ruleCount: 1234, sizeBytes: 18_500, version: '6.5.3'},
          {ruleCount: 12, sizeBytes: 240},
        ],
      },
    }

    expect(parse(extended)).toEqual(extended)
  })

  it('accepts a styles section without any styled-components sheets', () => {
    const withoutRuntime: StudioDiagnostics = {...report, styles: {styledComponents: []}}

    expect(parse(withoutRuntime)).toEqual(withoutRuntime)
  })

  it('rejects a styles section with the wrong shape', () => {
    expect(() => parse({...report, styles: {styledComponents: [{version: '6.5.3'}]}})).toThrow(
      'not a supported Studio diagnostics report',
    )
  })

  it('rejects a non-numeric styled-components size', () => {
    expect(() =>
      parse({
        ...report,
        styles: {styledComponents: [{ruleCount: 1, sizeBytes: '100'}]},
      }),
    ).toThrow('not a supported Studio diagnostics report')
  })

  it('accepts connection activity, findings and skipped tests', () => {
    const extended: StudioDiagnostics = {
      ...report,
      findings: [
        {
          detail: '3 Studio tabs in this browser have 97 open listeners.',
          id: 'request-limit-reached',
          severity: 'critical',
          title: "The browser's connection to Sanity is full",
        },
      ],
      maxDurationMs: 20_000,
      network: {
        ...report.network,
        connections: {
          currentTab: {longestPending: [], openStreams: 6, pendingRequests: 0, totalStarted: 20},
          tabs: {
            status: 'success',
            tabs: [],
            totals: {openStreams: 97, pendingRequests: 0, tabs: 3},
            waitedMs: 1000,
          },
        },
        listen: {
          first: {...listen, status: 'timeout', timedOut: true},
          secondWhileFirstOpen: {
            ...listen,
            skipReason: 'first-connection-failed',
            status: 'skipped',
          },
        },
        requests: [
          {
            durationMs: 0,
            path: '/ping',
            skipReason: 'time-limit',
            status: 'skipped',
            timedOut: false,
          },
        ],
        stalled: true,
      },
    }

    expect(parse(extended)).toEqual(extended)
  })

  it('rejects findings with an unknown severity', () => {
    expect(() =>
      parse({...report, findings: [{detail: 'x', id: 'x', severity: 'fatal', title: 'x'}]}),
    ).toThrow('not a supported Studio diagnostics report')
  })

  it('rejects malformed connection activity', () => {
    expect(() =>
      parse({
        ...report,
        network: {...report.network, connections: {currentTab: {openStreams: 'many'}}},
      }),
    ).toThrow('not a supported Studio diagnostics report')
  })

  it('rejects a non-boolean auto-updates flag', () => {
    expect(() => parse({...report, studio: {...report.studio, autoUpdates: 'yes'}})).toThrow(
      'not a supported Studio diagnostics report',
    )
  })
})

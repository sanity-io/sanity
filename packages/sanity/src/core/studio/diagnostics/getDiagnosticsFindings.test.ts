import {describe, expect, it} from 'vitest'

import {
  DIAGNOSTICS_FIXTURE,
  SATURATED_DIAGNOSTICS_FIXTURE,
} from '../components/navbar/resources/__tests__/diagnosticsFixture'
import {type StudioDiagnostics} from './gatherStudioDiagnostics'
import {getDiagnosticsFindings} from './getDiagnosticsFindings'

function withNetwork(network: Partial<StudioDiagnostics['network']>): StudioDiagnostics {
  return {...DIAGNOSTICS_FIXTURE, network: {...DIAGNOSTICS_FIXTURE.network, ...network}}
}

function ids(diagnostics: StudioDiagnostics): string[] {
  return getDiagnosticsFindings(diagnostics).map((finding) => finding.id)
}

const idleTab = {longestPending: [], openStreams: 6, pendingRequests: 0, totalStarted: 20}

describe('getDiagnosticsFindings', () => {
  it('has nothing to say about a healthy run', () => {
    expect(getDiagnosticsFindings(DIAGNOSTICS_FIXTURE)).toEqual([])
  })

  it('explains a full connection, a stalled ping and skipped tests', () => {
    const findings = getDiagnosticsFindings(SATURATED_DIAGNOSTICS_FIXTURE)

    expect(findings.map(({id, severity}) => ({id, severity}))).toEqual([
      {id: 'request-limit-reached', severity: 'critical'},
      {id: 'ping-timeout', severity: 'critical'},
      {id: 'time-limit', severity: 'info'},
    ])
    expect(findings[0].detail).toContain(
      '3 Studio tabs in this browser have 97 open listeners and 18 requests waiting for a response',
    )
    expect(findings[2].detail).toBe('Diagnostics stop after 20 seconds, so 2 tests were skipped.')
  })

  it('warns when the tabs are getting close to the limit', () => {
    const diagnostics = withNetwork({
      connections: {
        currentTab: idleTab,
        tabs: {
          status: 'success',
          tabs: [],
          totals: {openStreams: 64, pendingRequests: 0, tabs: 2},
          waitedMs: 1000,
        },
      },
    })

    expect(getDiagnosticsFindings(diagnostics)).toEqual([
      expect.objectContaining({id: 'request-limit-near', severity: 'warning'}),
    ])
  })

  it('falls back to the current tab when other tabs were not asked', () => {
    const diagnostics = withNetwork({
      connections: {currentTab: {...idleTab, openStreams: 95}},
    })

    expect(getDiagnosticsFindings(diagnostics)[0]?.detail).toContain(
      'This Studio tab has 95 open listeners.',
    )
  })

  it('tells a ping that waited in the browser apart from a slow response', () => {
    const timing = {
      connectionMs: 0,
      decodedBodySizeBytes: 4,
      dnsMs: 0,
      durationMs: 1840,
      encodedBodySizeBytes: 4,
      initiatorType: 'fetch',
      redirectMs: 0,
      requestToFirstByteMs: 38,
      responseTransferMs: 1,
      secureConnectionMs: 0,
      serverTiming: [],
      stalledMs: 1800,
      startTimeMs: 0,
      transferSizeBytes: 300,
    }
    const protocol = {durationMs: 1840, protocol: 'h3', status: 'success', timedOut: false} as const

    expect(ids(withNetwork({protocol: {...protocol, resourceTiming: timing}}))).toEqual([
      'ping-stalled',
    ])
    expect(
      ids(
        withNetwork({
          protocol: {
            ...protocol,
            resourceTiming: {...timing, requestToFirstByteMs: 1500, stalledMs: 2},
          },
        }),
      ),
    ).toEqual(['ping-slow-response'])
    expect(ids(withNetwork({protocol}))).toEqual(['ping-slow'])
  })

  it('points out long waits in this tab when the connection is not full', () => {
    const diagnostics = withNetwork({
      connections: {
        currentTab: {...idleTab, oldestPendingMs: 15_000, pendingRequests: 1},
      },
    })

    expect(getDiagnosticsFindings(diagnostics)).toEqual([
      expect.objectContaining({
        detail:
          '1 request in this tab has been waiting for a response, the longest for 15 seconds.',
        id: 'requests-waiting',
      }),
    ])
  })

  it('reports an offline browser instead of a stalling network', () => {
    const diagnostics: StudioDiagnostics = {
      ...SATURATED_DIAGNOSTICS_FIXTURE,
      browser: {...SATURATED_DIAGNOSTICS_FIXTURE.browser, online: false},
    }

    expect(ids(diagnostics)).toContain('browser-offline')
    expect(ids(diagnostics)).not.toContain('ping-timeout')
  })
})

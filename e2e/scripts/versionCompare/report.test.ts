import {describe, expect, test} from 'vitest'

import {type RequestEntry} from './network'
import {compareMetric, renderSummary, renderWaterfall, type ComparisonReport} from './report'
import {buildWaterfall} from './waterfall'

describe('versionCompare report', () => {
  test('compares medians and p75 as v7 relative to v6', () => {
    const metric = compareMetric('Login', 'ms', [100, 200, 300], [50, 100, 150])
    expect(metric.v6.median).toBe(200)
    expect(metric.diff.median).toEqual({absolute: -100, percent: -50})
    expect(metric.diff.p75).toEqual({absolute: -125, percent: -50})
  })

  test('renders one summary row per metric', () => {
    const report: ComparisonReport = {
      environment: {runs: 3},
      generatedAt: '2026-01-01T00:00:00.000Z',
      metrics: {size: compareMetric('JS raw', 'bytes', [2048], [1024])},
      profiles: {
        'slow-4g': {
          cacheDisabled: true,
          cpuThrottle: 4,
          metrics: {
            login: compareMetric('Login ready', 'ms', [1000, 2000, 3000], [500, 1000, 1500]),
          },
          network: {downloadKbps: 1600, latencyMs: 150, uploadKbps: 750},
        },
      },
      schemaVersion: 3,
      versions: {
        v6: {ref: 'main', sanityVersion: '6.0.0', sha: 'a'.repeat(40)},
        v7: {ref: 'next-major', sanityVersion: '7.0.0', sha: 'b'.repeat(40)},
      },
    }
    const markdown = renderSummary(report)
    expect(markdown).toContain(
      '| Login ready | 2.00 s (p75 2.50 s) | 1.00 s (p75 1.25 s) | -1.00 s (-50.0%) |',
    )
    expect(markdown).toContain('150 ms RTT, 1.6 Mbps down / 0.75 Mbps up, 4x CPU throttle')
    expect(markdown).toContain('| JS raw | 2.0 KiB | 1.0 KiB | -1.0 KiB (-50.0%) |')
  })

  test('renders the traced load next to the timings', () => {
    const request = (overrides: Partial<RequestEntry>): RequestEntry => ({
      category: 'js',
      decodedBytes: 4096,
      endMs: 400,
      failed: null,
      id: 'entry',
      initiator: {
        fromCode: false,
        requestId: null,
        type: 'parser',
        url: 'http://localhost:3339/404',
      },
      method: 'GET',
      protocol: 'h2',
      queuedMs: 5,
      resourceType: 'Script',
      responseMs: 300,
      startMs: 100,
      status: 200,
      transferBytes: 1024,
      url: 'http://localhost:3339/static/sanity.js',
      waitMs: 120,
      ...overrides,
    })
    const requests = [
      request({
        category: 'document',
        endMs: 90,
        id: 'doc',
        initiator: {fromCode: false, requestId: null, type: 'other', url: null},
        startMs: 0,
        url: 'http://localhost:3339/404',
      }),
      request({}),
    ]
    const waterfall = buildWaterfall({
      files: {network: 'n.json', trace: 't.json'},
      mainThread: null,
      path: '/404',
      readyMs: 600,
      requests,
      tasks: [],
    })
    const markdown = renderWaterfall({v6: waterfall, v7: waterfall}).join('\n')
    expect(markdown).toContain('| Requests started before ready | 2 | 2 |')
    expect(markdown).toContain(
      '| JS before ready, transferred (decoded) | 1.0 KiB (4.0 KiB) | 1.0 KiB (4.0 KiB) |',
    )
    expect(markdown).toContain(
      '| 0.10 s | 5 ms | 120 ms | 0.40 s | 1.0 KiB | `GET /static/sanity.js` | js, h2 |',
    )
  })
})

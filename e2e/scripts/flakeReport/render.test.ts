import {describe, expect, it} from 'vitest'

import {DEFAULT_THRESHOLDS} from './classify'
import {renderMarkdown} from './render'
import {type FlakeReport, type RunAnalysis, type WorkflowRun} from './types'

function run(id: number, conclusion: string, branch: string, createdAt: string): WorkflowRun {
  return {
    attempt: 1,
    branch,
    conclusion,
    createdAt,
    event: 'pull_request',
    id,
    prNumber: id,
    status: 'completed',
    title: `PR ${id}`,
    url: `https://github.com/sanity-io/sanity/actions/runs/${id}`,
  }
}

const platformRun: RunAnalysis = {
  coverage: 'captured',
  failedJobs: ['playwright-test (chromium, 1, 4)'],
  reasons: ['spec.ts › case [chromium-1]: degraded — query median 1110 ms over 15 requests'],
  run: run(1, 'failure', 'renovate/a', '2026-08-31T12:38:00Z'),
  setupFailures: [],
  tests: [
    {
      attempts: [
        {
          attempt: 1,
          diagnostics: {
            diagnosticVersion: 1,
            durationMs: 5000,
            generatedAt: '2026-08-31T12:39:05Z',
            network: {
              listen: {
                first: {durationMs: 100, status: 'success'},
                secondWhileFirstOpen: {durationMs: 100, status: 'success'},
              },
              protocol: {durationMs: 90, protocol: 'h3', status: 'success', timedOut: false},
              requestHistory: {
                entries: [],
                sessionSummary: {buckets: [], startedAt: '', totalRequests: 0},
                totalRequests: 0,
              },
              requests: [],
              shard: 'gcp-eu-w1-03-stag-1009',
            },
            startedAt: '2026-08-31T12:39:00Z',
            studio: {dataset: 'd', projectId: 'p', version: '6.11.0'},
          },
          evidence: ['query median 1110 ms over 15 requests'],
          kind: 'studio',
          status: 'failed',
          verdict: 'degraded',
        },
      ],
      outcome: 'failed',
      shard: 'chromium-1',
      title: 'spec.ts › case',
    },
  ],
  verdict: 'platform',
}

const unknownRun: RunAnalysis = {
  coverage: 'none',
  failedJobs: ['dataset-setup'],
  reasons: ['dataset-setup: other'],
  run: run(2, 'failure', 'feature/b', '2026-08-30T09:00:00Z'),
  setupFailures: [{job: 'dataset-setup', signature: 'other', url: 'u'}],
  tests: [],
  verdict: 'unknown',
}

const report: FlakeReport = {
  clusters: [],
  failed: [platformRun, unknownRun],
  generatedAt: '2026-09-01T00:00:00Z',
  repo: 'sanity-io/sanity',
  runs: [
    platformRun.run,
    unknownRun.run,
    run(3, 'success', 'main', '2026-08-31T13:00:00Z'),
    run(4, 'cancelled', 'feature/c', '2026-08-31T13:10:00Z'),
  ],
  since: '2026-08-25T00:00:00Z',
  thresholds: DEFAULT_THRESHOLDS,
  until: '2026-09-01T00:00:00Z',
  workflow: 'e2e.yml',
}

describe('renderMarkdown', () => {
  it('summarizes run outcomes, verdict shares, and per-run evidence', () => {
    const markdown = renderMarkdown(report)

    expect(markdown).toContain(
      '**4 completed runs**: 1 passed, 2 failed, 1 cancelled. 0 still running.',
    )
    expect(markdown).toContain('| Platform / network degraded | 1 | 50% | 100% |')
    expect(markdown).toContain('| Unknown (no diagnostics data) | 1 | 50% | – |')
    expect(markdown).toContain('**1 (100%) show API degradation**')
    expect(markdown).toContain('[#1](https://github.com/sanity-io/sanity/actions/runs/1)')
    expect(markdown).toContain('`gcp-eu-w1-03-stag-1009` (1 captures, 1 degraded)')
    expect(markdown).toContain('1× query median N ms over N requests')
    expect(markdown).toContain('| `spec.ts` | 1 | 0 | 1 |')
    expect(markdown).toContain('No window with ≥3 failed runs')
  })
})

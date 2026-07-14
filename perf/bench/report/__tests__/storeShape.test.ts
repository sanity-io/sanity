import {describe, expect, it} from 'vitest'

import {toStorableRun} from '../storeShape'
import {type BenchRunDocument} from '../types'

const RUN: BenchRunDocument = {
  _type: 'benchRun',
  schemaVersion: 1,
  mode: 'ab',
  git: {sha: 'abcdef1234567890', branch: 'main'},
  startedAt: '2026-07-06T12:00:00.000Z',
  completedAt: '2026-07-06T12:11:00.000Z',
  runner: {
    os: 'linux',
    arch: 'x64',
    cpus: 8,
    memGb: 32,
    nodeVersion: 'v24.0.0',
    ci: true,
    calibrationMs: 11,
  },
  config: {cpuThrottleRate: 4, seed: 1},
  scenarios: [
    {
      scenario: 'singleString',
      // Per-scenario shard calibration (stamped by mergeShards)
      runner: {calibrationMs: 17},
      kind: 'interaction',
      metrics: [
        {
          label: 'stringField',
          unit: 'ms',
          presentAsEfps: true,
          experiment: {
            sessions: [
              [30, 32],
              [31, 33],
            ],
            summary: {n: 4, median: 31.5, p75: 32, p90: 33, p99: 33, min: 30, max: 33},
          },
          reference: {
            sessions: [[29, 30]],
            summary: {n: 2, median: 29.5, p75: 30, p90: 30, p99: 30, min: 29, max: 30},
          },
          comparison: {diff: 2, lo: 1, hi: 3, verdict: 'regression'},
        },
      ],
      failures: [{side: 'reference', reason: 'console-error'}],
      interruptions: {experiment: {count: 0, totalMs: 0}},
      loafAttribution: [{sourceUrl: 'https://x/y.js', functionName: 'f', totalMs: 10}],
      resources: {
        experiment: {requestCount: 10, requestBytes: 1000, byClass: {listen: 3, actions: 7}},
      },
      soak: {
        minutes: 2,
        samples: [
          {
            minute: 0,
            heapMb: 80,
            domNodes: 100,
            listeners: 10,
            latencyP50Ms: null,
            cpuTaskMs: null,
            connections: 2,
            requests: 40,
          },
          {
            minute: 1,
            heapMb: 81,
            domNodes: 100,
            listeners: 10,
            latencyP50Ms: 24,
            cpuTaskMs: 5100,
            connections: 2,
            requests: 3,
          },
        ],
      },
    },
  ],
}

/** Recursively assert no array directly inside an array (undeclarable in a studio schema). */
function assertNoNestedArrays(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      expect(Array.isArray(item), `nested array at ${path}[${index}]`).toBe(false)
      assertNoNestedArrays(item, `${path}[${index}]`)
    }
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      assertNoNestedArrays(nested, `${path}.${key}`)
    }
  }
}

/** Recursively assert every object inside an array carries a `_key`. */
function assertKeyedArrayItems(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      if (item && typeof item === 'object') {
        expect(item, `missing _key at ${path}[${index}]`).toHaveProperty('_key')
      }
      assertKeyedArrayItems(item, `${path}[${index}]`)
    }
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      assertKeyedArrayItems(nested, `${path}.${key}`)
    }
  }
}

describe('toStorableRun', () => {
  it('produces no directly nested arrays (matches the metrics-studio schema)', () => {
    assertNoNestedArrays(toStorableRun(RUN), 'run')
  })

  it('gives every array object a _key', () => {
    assertKeyedArrayItems(toStorableRun(RUN), 'run')
  })

  it('wraps per-session samples and preserves their values', () => {
    const stored = toStorableRun(RUN)
    expect(stored.scenarios[0].metrics[0].experiment.sessions).toEqual([
      {_key: 'session-0', samples: [30, 32]},
      {_key: 'session-1', samples: [31, 33]},
    ])
  })

  it('preserves the per-scenario shard runner calibration', () => {
    const stored = toStorableRun(RUN)
    expect(stored.scenarios[0].runner).toEqual({calibrationMs: 17})
  })

  it('converts byClass records to keyed arrays', () => {
    const stored = toStorableRun(RUN)
    expect(stored.scenarios[0].resources?.experiment.byClass).toEqual([
      {_key: 'listen', endpointClass: 'listen', count: 3},
      {_key: 'actions', endpointClass: 'actions', count: 7},
    ])
  })

  it('leaves the input document untouched', () => {
    const before = JSON.parse(JSON.stringify(RUN))
    toStorableRun(RUN)
    expect(RUN).toEqual(before)
  })
})

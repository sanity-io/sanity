/**
 * Dev-only synthetic data for the Trends tool: deterministic (seeded PRNG,
 * never Math.random) runs exhibiting the shapes the charts and the future
 * drift feed must handle — steady noise, slow drift, step changes in both
 * directions, host-speed-correlated noise (why the calibration strip
 * exists), an auth round-trip drop, and sparse/single/empty datasets.
 */
import {type TrendRun} from './data'

/** mulberry32 — same tiny PRNG the bench fixtures use. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEBUG_SOURCES = ['demo', 'sparse', 'single-run', 'empty'] as const
export type DebugSource = (typeof DEBUG_SOURCES)[number]

const DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

function fakeSha(rng: () => number): string {
  return Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('')
}

function summary(rng: () => number, median: number) {
  const p50 = Math.max(1, median + (rng() - 0.5) * median * 0.06)
  return {median: p50, p75: p50 * (1.05 + rng() * 0.05), p90: p50 * (1.15 + rng() * 0.1)}
}

function metric(
  rng: () => number,
  label: string,
  median: number,
  unit: 'ms' | 'count' = 'ms',
): NonNullable<NonNullable<TrendRun['scenarios']>[number]['metrics']>[number] {
  return {
    label,
    unit,
    experiment: {
      summary: unit === 'count' ? {median, p75: median, p90: median} : summary(rng, median),
    },
  }
}

function generateDemo(branch = 'main', shift = 0): TrendRun[] {
  const rng = mulberry32(branch === 'main' ? 42 : 99)
  const start = Date.now() - DAYS * DAY_MS
  const runs: TrendRun[] = []

  for (let day = 0; day < DAYS; day++) {
    // Host speed wave (9–13ms) — some series correlate with it on purpose
    const calibration = 11 + 2 * Math.sin(day / 9) + (rng() - 0.5)
    const hostFactor = calibration / 11

    runs.push({
      _id: `debug-run-${branch}-${day}`,
      startedAt: new Date(start + day * DAY_MS).toISOString(),
      mode: 'absolute',
      git: {sha: fakeSha(rng), branch},
      runner: {calibrationMs: calibration},
      bundle: {
        experiment: {
          // Slow growth with an occasional dependency-bump jump
          initialJsBytes: Math.round(1_420_000 + day * 400 + (day > 55 ? 18_000 : 0)),
        },
      },
      scenarios: [
        {
          scenario: 'singleString',
          kind: 'interaction',
          metrics: [metric(rng, 'stringField', 32 + shift)], // steady (branch offset)
        },
        {
          scenario: 'article',
          kind: 'interaction',
          metrics: [
            metric(rng, 'title', 30 + day * 0.09), // slow drift up
            metric(rng, 'body', day < 60 ? 36 : 44), // step regression at day 60
          ],
        },
        {
          scenario: 'recipe',
          kind: 'interaction',
          metrics: [metric(rng, 'name', day < 45 ? 40 : 33)], // improvement at day 45
        },
        {
          scenario: 'synthetic',
          kind: 'interaction',
          // Tracks host speed — read against the calibration strip
          metrics: [metric(rng, 'title', 34 * hostFactor)],
        },
        {
          scenario: 'singleString',
          kind: 'pageload',
          metrics: [
            metric(rng, 'boot-cold · time to editable', day < 70 ? 4200 : 4600),
            // The auth story: a serialized round trip removed at day 50
            metric(rng, 'boot-cold · auth round trips', day < 50 ? 2 : 1, 'count'),
            metric(rng, 'boot-cold · auth in flight', day < 50 ? 84 : 42),
          ],
        },
      ],
    })
  }
  return runs
}

export function generateDebugRuns(source: DebugSource): TrendRun[] {
  // Two branches so the branch filter / comparison is exercisable; perf-bench
  // runs ~4ms faster on the steady metric
  const demo = [...generateDemo('main', 0), ...generateDemo('perf-bench', -4)]
  switch (source) {
    case 'demo':
      return demo
    case 'sparse':
      return demo.filter((_, index) => index % 7 === 0)
    case 'single-run':
      return demo.filter((run) => run.git?.branch === 'main').slice(-1)
    case 'empty':
      return []
    default:
      return source satisfies never
  }
}
